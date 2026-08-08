import uuid
from django.db import models
from backend_sigi.modules.users.models import Users
from backend_sigi.modules.materials.models import ConsumableMaterial, ReturnableMaterial


class IdentityToken(models.Model):
    """
    Token temporal para confirmar la identidad vía correo antes de crear un préstamo.

    Requiere doble confirmación: tanto el prestador (cuentadante que entrega los
    materiales) como el solicitante (persona que los recibe) deben abrir el enlace
    que les llega por correo. El préstamo solo puede crearse cuando ambos confirmaron.

    Se genera al hacer clic en 'Confirmar identidad' y se invalida al crear el préstamo.
    """
    token      = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    # Sin limit_choices_to: prestar ya no es exclusivo de los cuentadantes.
    # Puede prestar cualquier usuario con permiso de crear préstamos, y eso se
    # valida en el serializer, no en el modelo.
    lender     = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        related_name='identity_tokens',
    )
    # Persona que recibe los materiales. Nullable por dos razones: los tokens
    # anteriores a la doble confirmación, y los solicitantes que no están
    # registrados en el sistema, que se identifican con requester_email.
    requester  = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='identity_tokens_as_requester',
    )
    # Correo del solicitante cuando NO es un usuario del sistema. Es a donde
    # se manda el enlace de confirmación en ese caso.
    requester_email = models.EmailField(blank=True, default='')

    # Confirmación individual de cada parte
    lender_confirmed    = models.BooleanField(default=False)
    requester_confirmed = models.BooleanField(default=False)

    created_at   = models.DateTimeField(auto_now_add=True)

    @property
    def correo_solicitante(self):
        """
        A dónde mandarle el enlace al solicitante.

        Si está registrado se usa su correo de usuario; si no, el que se
        escribió en el formulario.
        """
        return self.requester.email if self.requester_id else self.requester_email

    @property
    def is_confirmed(self):
        """
        El token se considera confirmado solo cuando ambas partes aceptaron.

        Si no hay ni solicitante registrado ni correo escrito (tokens antiguos,
        anteriores a la doble confirmación), basta con el prestador.
        """
        if self.requester_id is None and not self.requester_email:
            return self.lender_confirmed
        return self.lender_confirmed and self.requester_confirmed

    class Meta:
        db_table = 'identity_token'

    def __str__(self):
        return f"Token {self.token} — {'confirmado' if self.is_confirmed else 'pendiente'}"


class Loan(models.Model):

    LOAN_TYPES = [
        ('interno', 'Interno'),
        ('externo', 'Externo'),
    ]

    LOAN_STATUSES = [
        ('activo',                  'Activo'),
        ('devolucion_parcial',      'Devolución parcial'),
        ('en_espera_aceptacion',    'En espera de aceptación'),
        ('finalizado',              'Finalizado'),
        ('pendiente',               'Pendiente'),
    ]

    # Código visible (AAA000000001 …) — se genera automáticamente en save()
    loan_code = models.CharField(max_length=12, unique=True, editable=False)

    # Solicitante registrado en el sistema. Nullable porque también se le puede
    # prestar a alguien que no tiene usuario: en ese caso va requester_email.
    # Exactamente uno de los dos debe estar lleno (ver CheckConstraint abajo).
    loan_user_requester = models.ForeignKey(
        Users,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='loans_as_requester',
    )
    # Correo del solicitante cuando NO está registrado. Es lo único que se le
    # pide, y es a donde llega el enlace de confirmación de identidad.
    requester_email = models.EmailField(blank=True, default='')

    # Sin limit_choices_to: prestar dejó de ser exclusivo de los cuentadantes.
    # Ahora puede hacerlo cualquier usuario con permiso de crear préstamos, y
    # eso se valida en el serializer porque depende de permisos, no de un campo.
    loan_user_lender = models.ForeignKey(
        Users,
        on_delete=models.PROTECT,
        related_name='loans_as_lender',
    )

    # Ficha de aprendices — opcional: hay préstamos que no son para un grupo
    loan_students_group = models.CharField(max_length=7, blank=True, default='')
    loan_justification  = models.TextField()
    loan_type           = models.CharField(max_length=10, choices=LOAN_TYPES)
    loan_date_out       = models.DateField()
    loan_date_in        = models.DateField()
    loan_status         = models.CharField(max_length=20, choices=LOAN_STATUSES, default='activo')

    # Confirmación de identidad
    identity_confirmed = models.BooleanField(default=False)
    identity_token     = models.OneToOneField(
        IdentityToken,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='loan',
    )

    # ── Devolución ────────────────────────────────────────────────────────────
    returned_by          = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='loans_returned',
    )
    returned_at          = models.DateTimeField(null=True, blank=True)
    return_observations  = models.TextField(blank=True, default='')

    # ── Aceptación de devolución ───────────────────────────────────────────────
    accepted_by          = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='loans_accepted',
    )
    accepted_at          = models.DateTimeField(null=True, blank=True)
    accept_observations  = models.TextField(blank=True, default='')

    # ── Recordatorios de vencimiento ───────────────────────────────────────────
    # Marcan cuándo se envió cada aviso, para que el comando programado
    # (enviar_recordatorios) no mande el mismo correo dos veces si llega a
    # ejecutarse más de una vez el mismo día.
    # Solo aplican a préstamos externos.
    reminder_previo_sent_at = models.DateTimeField(null=True, blank=True)  # un día antes
    reminder_vence_sent_at  = models.DateTimeField(null=True, blank=True)  # el día del vencimiento

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Generación automática del loan_code

    def save(self, *args, **kwargs):
        if not self.loan_code:
            self.loan_code = self._generate_loan_code()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_loan_code(cls):
        last = cls.objects.order_by('-id').first()
        if not last:
            return 'AAA000000001'

        letters = last.loan_code[:3]
        number  = int(last.loan_code[3:]) + 1

        if number > 999_999_999:
            number  = 1
            letters = cls._increment_letters(letters)

        return f"{letters}{number:09d}"

    @staticmethod
    def _increment_letters(letters):
        chars = list(letters)
        for i in range(2, -1, -1):   # de derecha a izquierda
            if chars[i] < 'Z':
                chars[i] = chr(ord(chars[i]) + 1)
                break
            chars[i] = 'A'
        return ''.join(chars)

    @property
    def requester_display(self):
        """
        Cómo identificar al solicitante en las tablas y reportes.

        Si está registrado, su número de documento; si no, el correo que se
        escribió al crear el préstamo.
        """
        if self.loan_user_requester_id:
            return self.loan_user_requester.user_document
        return self.requester_email

    class Meta:
        db_table = 'loan'
        verbose_name = 'préstamo'
        verbose_name_plural = 'préstamos'
        permissions = [
            ('listar_loan',          'Listar préstamos'),
            ('generar_reporte_loan', 'Generar reporte préstamos'),
        ]
        constraints = [
            # El solicitante es un usuario registrado O un correo suelto, nunca
            # ambos ni ninguno. Mismo patrón de "exactamente uno" que usan
            # LoanItem y TechnicalSheetFile.
            models.CheckConstraint(
                name='loan_requester_registrado_o_correo',
                condition=(
                    models.Q(loan_user_requester__isnull=False, requester_email='') |
                    models.Q(loan_user_requester__isnull=True) & ~models.Q(requester_email='')
                ),
            ),
        ]

    def __str__(self):
        return self.loan_code


class LoanItem(models.Model):
    """
    Cada fila representa un material dentro de un préstamo.
    Solo uno de los dos FK (consumable/returnable) debe estar lleno.
    """
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='items')

    # Exactamente uno de los dos debe estar lleno
    consumable_material = models.ForeignKey(
        ConsumableMaterial,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='loan_items',
    )
    returnable_material = models.ForeignKey(
        ReturnableMaterial,
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='loan_items',
    )

    ITEM_STATE_CHOICES = [
        ('bueno',   'Bueno'),
        ('dañado',  'Dañado'),
        ('perdido', 'Perdido'),
    ]

    quantity_loaned   = models.PositiveIntegerField()
    quantity_returned = models.PositiveIntegerField(default=0)
    item_state        = models.CharField(
        max_length=10,
        choices=ITEM_STATE_CHOICES,
        default='bueno',
    )
    # Distribución de estados para herramientas sin placa con cantidad > 1
    # Solo se llena cuando el ítem se devuelve con distribución; None = usa item_state simple
    quantity_bueno   = models.PositiveIntegerField(null=True, blank=True)
    quantity_danado  = models.PositiveIntegerField(null=True, blank=True)
    quantity_perdido = models.PositiveIntegerField(null=True, blank=True)

    # ── Campos calculados ──────────────────────────────────────────────────────

    @property
    def material_type(self):
        """'consumable' o 'returnable' según qué FK esté lleno."""
        return 'consumable' if self.consumable_material_id else 'returnable'

    @property
    def is_returned(self):
        """
        Los consumibles se consideran siempre devueltos (se gastan).
        Los devolutivos se marcan como devueltos cuando quantity_returned >= quantity_loaned.
        """
        if self.material_type == 'consumable':
            return True
        return self.quantity_returned >= self.quantity_loaned

    class Meta:
        db_table = 'loan_item'
        # Garantiza que nunca queden ambos FK llenos o ambos vacíos
        constraints = [
            models.CheckConstraint(
                name='loan_item_one_material_type',
                condition=(
                    models.Q(consumable_material__isnull=False, returnable_material__isnull=True) |
                    models.Q(consumable_material__isnull=True,  returnable_material__isnull=False)
                ),
            )
        ]

    def __str__(self):
        material = self.consumable_material or self.returnable_material
        return f"{self.loan.loan_code} — {material} × {self.quantity_loaned}"
