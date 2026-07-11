import uuid
from django.db import models
from backend_sigi.modules.users.models import Users
from backend_sigi.modules.materials.models import ConsumableMaterial, ReturnableMaterial


class IdentityToken(models.Model):
    """
    Token temporal para confirmar la identidad del prestador vía correo.
    Se genera al hacer clic en 'Confirmar identidad' y se invalida al crear el préstamo.
    """
    token      = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    lender     = models.ForeignKey(
        Users,
        on_delete=models.CASCADE,
        limit_choices_to={'is_accountant': True},
        related_name='identity_tokens',
    )
    is_confirmed = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

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

    loan_user_requester = models.ForeignKey(
        Users,
        on_delete=models.PROTECT,
        related_name='loans_as_requester',
    )
    loan_user_lender = models.ForeignKey(
        Users,
        on_delete=models.PROTECT,
        related_name='loans_as_lender',
        limit_choices_to={'is_accountant': True},
    )

    loan_students_group = models.CharField(max_length=7)
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

    class Meta:
        db_table = 'loan'
        permissions = [
            ('listar_loan',          'Listar préstamos'),
            ('generar_reporte_loan', 'Generar reporte préstamos'),
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
