from rest_framework import serializers
from django.db import transaction

from backend_sigi.modules.users.models import Users
from backend_sigi.modules.materials.models import ConsumableMaterial, ReturnableMaterial
from .models import IdentityToken, Loan, LoanItem


# 
# Helpers
# 

class UserShortSerializer(serializers.ModelSerializer):
    """Datos mínimos de un usuario para mostrar en la tabla de préstamos."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = Users
        fields = ['id', 'full_name', 'email']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


# 
# LoanItem — lectura
# 

class LoanItemReadSerializer(serializers.ModelSerializer):
    """
    Representa un ítem de préstamo aplanado con los campos que muestra
    LoanMaterialsTable en el frontend.
    """
    material_id   = serializers.SerializerMethodField()
    material_name = serializers.SerializerMethodField()
    placa_sena    = serializers.SerializerMethodField()
    serial        = serializers.SerializerMethodField()
    material_type = serializers.SerializerMethodField()
    is_returned   = serializers.SerializerMethodField()

    class Meta:
        model  = LoanItem
        fields = [
            'id',
            'material_id',
            'material_name',
            'placa_sena',
            'serial',
            'material_type',
            'quantity_loaned',
            'quantity_returned',
            'is_returned',
        ]

    def _material(self, obj):
        return obj.consumable_material or obj.returnable_material

    def get_material_id(self, obj):
        m = self._material(obj)
        return m.id if m else None

    def get_material_name(self, obj):
        m = self._material(obj)
        return m.material_name if m else ''

    def get_placa_sena(self, obj):
        m = self._material(obj)
        return getattr(m, 'material_barcode_sena', None)

    def get_serial(self, obj):
        m = self._material(obj)
        return getattr(m, 'material_serial', None)

    def get_material_type(self, obj):
        return obj.material_type   # @property del modelo

    def get_is_returned(self, obj):
        return obj.is_returned     # @property del modelo


# 
# Loan — lista (tabla)
# 

class LoanListSerializer(serializers.ModelSerializer):
    """
    Devuelve snake_case consistente con el resto del proyecto.
    El frontend mapea los campos en loanService.js igual que en materiales/usuarios.
    """
    loan_user_requester = serializers.SerializerMethodField()
    loan_user_lender    = serializers.SerializerMethodField()

    class Meta:
        model  = Loan
        fields = [
            'id',
            'loan_code',
            'loan_user_requester',
            'loan_user_lender',
            'loan_students_group',
            'loan_justification',
            'loan_type',
            'loan_date_out',
            'loan_date_in',
            'loan_status',
            'identity_confirmed',
            'created_at',
            'updated_at',
        ]

    def get_loan_user_requester(self, obj):
        u = obj.loan_user_requester
        return f"{u.first_name} {u.last_name}".strip() or u.email

    def get_loan_user_lender(self, obj):
        u = obj.loan_user_lender
        return f"{u.first_name} {u.last_name}".strip() or u.email


#
# Loan — detalle (vista individual)
#

class LoanDetailSerializer(LoanListSerializer):
    """
    Extiende LoanListSerializer añadiendo los ítems del préstamo.
    Usado en la página de vista y edición.
    """
    loan_materials = LoanItemReadSerializer(source='items', many=True)

    class Meta(LoanListSerializer.Meta):
        fields = LoanListSerializer.Meta.fields + ['loan_materials']


# 
# LoanItem — escritura (para crear préstamo)
# 

class LoanItemWriteSerializer(serializers.Serializer):
    """
    Payload de cada ítem al crear un préstamo.
    El frontend envía material_id + material_type + quantity_loaned.
    """
    material_id    = serializers.IntegerField()
    material_type  = serializers.ChoiceField(choices=['consumable', 'returnable'])
    quantity_loaned = serializers.IntegerField(min_value=1)

    def validate(self, data):
        mid   = data['material_id']
        mtype = data['material_type']
        qty   = data['quantity_loaned']

        if mtype == 'consumable':
            try:
                material = ConsumableMaterial.objects.get(pk=mid, is_active=True)
            except ConsumableMaterial.DoesNotExist:
                raise serializers.ValidationError(
                    {'material_id': 'Material consumible no encontrado o inactivo.'}
                )
            if material.material_quantity_available < qty:
                raise serializers.ValidationError(
                    {'quantity_loaned': f'Stock insuficiente. Disponible: {material.material_quantity_available}.'}
                )
            data['_material_obj'] = material

        else:  # returnable
            try:
                material = ReturnableMaterial.objects.get(pk=mid, is_active=True)
            except ReturnableMaterial.DoesNotExist:
                raise serializers.ValidationError(
                    {'material_id': 'Material devolutivo no encontrado o inactivo.'}
                )
            # Con placa SENA el ítem es único → solo cantidad 1
            # Sin placa (herramienta genérica) → puede prestarse en cantidad > 1
            if material.material_barcode_sena and qty != 1:
                raise serializers.ValidationError(
                    {'quantity_loaned': 'Los materiales con placa SENA solo se prestan de 1 en 1.'}
                )
            if material.material_quantity_available < qty:
                raise serializers.ValidationError(
                    {'quantity_loaned': f'Stock insuficiente. Disponible: {material.material_quantity_available}.'}
                )
            data['_material_obj'] = material

        return data


# 
# Loan — crear
# 

class LoanCreateSerializer(serializers.Serializer):
    """
    Crea un Loan junto con sus LoanItems en una sola transacción.
    También descuenta el stock de consumibles y aumenta material_quantity_loaned
    en devolutivos.
    """
    loan_user_requester  = serializers.PrimaryKeyRelatedField(queryset=Users.objects.filter(is_active=True))
    loan_user_lender     = serializers.PrimaryKeyRelatedField(queryset=Users.objects.filter(is_accountant=True, is_active=True))
    loan_students_group  = serializers.CharField(max_length=7)
    loan_justification   = serializers.CharField(max_length=500)
    loan_type            = serializers.ChoiceField(choices=['interno', 'externo'])
    loan_date_out        = serializers.DateField()
    loan_date_in         = serializers.DateField()
    items                = LoanItemWriteSerializer(many=True)
    # UUID del token confirmado — opcional, se vincula al préstamo si existe
    identity_token       = serializers.UUIDField(required=False, allow_null=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('El préstamo debe tener al menos un material.')
        return value

    def validate(self, data):
        if data['loan_date_in'] < data['loan_date_out']:
            raise serializers.ValidationError(
                {'loan_date_in': 'La fecha de entrega no puede ser anterior a la de salida.'}
            )
        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data         = validated_data.pop('items')
        identity_token_uuid = validated_data.pop('identity_token', None)

        loan = Loan.objects.create(**validated_data)

        # Vincula el token de identidad si fue confirmado
        if identity_token_uuid:
            try:
                token_obj = IdentityToken.objects.get(token=identity_token_uuid, is_confirmed=True)
                loan.identity_token     = token_obj
                loan.identity_confirmed = True
                loan.save(update_fields=['identity_token', 'identity_confirmed'])
            except IdentityToken.DoesNotExist:
                pass

        for item in items_data:
            material     = item['_material_obj']
            mtype        = item['material_type']
            qty          = item['quantity_loaned']

            if mtype == 'consumable':
                LoanItem.objects.create(
                    loan=loan,
                    consumable_material=material,
                    quantity_loaned=qty,
                )
                # Descuenta el stock del consumible
                ConsumableMaterial.objects.filter(pk=material.pk).update(
                    material_quantity=material.material_quantity - qty
                )
            else:
                LoanItem.objects.create(
                    loan=loan,
                    returnable_material=material,
                    quantity_loaned=qty,
                )
                # Marca el devolutivo como prestado
                ReturnableMaterial.objects.filter(pk=material.pk).update(
                    material_quantity_loaned=material.material_quantity_loaned + qty
                )

        return loan


# 
# Loan — editar (solo los campos editables según el frontend)
# 

class LoanUpdateSerializer(serializers.ModelSerializer):
    """
    Solo permite editar: fecha de entrega, justificación y estado.
    El prestador y la fecha de salida quedan bloqueados (disabled en el form).
    """
    class Meta:
        model  = Loan
        fields = ['loan_date_in', 'loan_justification', 'loan_status']

    def validate_loan_date_in(self, value):
        if value < self.instance.loan_date_out:
            raise serializers.ValidationError(
                'La fecha de entrega no puede ser anterior a la fecha de salida.'
            )
        return value

    def validate_loan_status(self, value):
        # No se puede reabrir un préstamo ya finalizado
        if self.instance.loan_status == 'finalizado' and value != 'finalizado':
            raise serializers.ValidationError(
                'Un préstamo finalizado no puede cambiar de estado.'
            )
        return value


# 
# Devolución parcial o total
# 

class ReturnItemSerializer(serializers.Serializer):
    """Un ítem dentro del payload de devolución."""
    loan_item_id      = serializers.IntegerField()
    quantity_returned = serializers.IntegerField(min_value=0)


class LoanReturnSerializer(serializers.Serializer):
    """
    Registra la devolución de materiales de un préstamo.
    Acepta una lista de ítems con su cantidad devuelta.
    Actualiza loan_status automáticamente al finalizar.
    """
    items = ReturnItemSerializer(many=True)
    note  = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('Debes indicar al menos un ítem a devolver.')
        return value

    @transaction.atomic
    def save(self, loan):
        items_data = self.validated_data['items']

        for item_data in items_data:
            try:
                loan_item = LoanItem.objects.select_related(
                    'returnable_material', 'consumable_material'
                ).get(pk=item_data['loan_item_id'], loan=loan)
            except LoanItem.DoesNotExist:
                raise serializers.ValidationError(
                    {'loan_item_id': f'Ítem {item_data["loan_item_id"]} no pertenece a este préstamo.'}
                )

            new_returned = item_data['quantity_returned']

            if new_returned > loan_item.quantity_loaned:
                raise serializers.ValidationError(
                    {'quantity_returned': f'No se puede devolver más de {loan_item.quantity_loaned} unidades.'}
                )

            delta = new_returned - loan_item.quantity_returned

            if loan_item.material_type == 'returnable':
                # Devolutivo: obligatorio devolver — se descuenta de material_quantity_loaned
                loan_item.quantity_returned = new_returned
                loan_item.save(update_fields=['quantity_returned'])

                if delta > 0:
                    ReturnableMaterial.objects.filter(pk=loan_item.returnable_material_id).update(
                        material_quantity_loaned=loan_item.returnable_material.material_quantity_loaned - delta
                    )

            else:
                # Consumible: devolución opcional — si se devuelven unidades no usadas,
                # se suman de vuelta al stock. Si delta == 0 no se hace nada.
                if delta > 0:
                    loan_item.quantity_returned = new_returned
                    loan_item.save(update_fields=['quantity_returned'])
                    ConsumableMaterial.objects.filter(pk=loan_item.consumable_material_id).update(
                        material_quantity=loan_item.consumable_material.material_quantity + delta
                    )

        # Recalcula el estado del préstamo
        all_items    = loan.items.all()
        all_returned = all(item.is_returned for item in all_items)
        some_returned = any(
            item.quantity_returned > 0
            for item in all_items
            if item.material_type == 'returnable'
        )

        if all_returned:
            loan.loan_status = 'finalizado'
        elif some_returned:
            loan.loan_status = 'devolucion_parcial'

        loan.save(update_fields=['loan_status', 'updated_at'])
        return loan


# 
# Confirmación de identidad
# 

class IdentityTokenCreateSerializer(serializers.Serializer):
    """
    Genera un token de confirmación para el prestador y lo envía por correo.
    El frontend llama a este endpoint cuando el usuario presiona 'Confirmar identidad'.
    """
    lender_id = serializers.PrimaryKeyRelatedField(
        queryset=Users.objects.filter(is_accountant=True, is_active=True)
    )

    def create(self, validated_data):
        lender = validated_data['lender_id']
        # Invalida tokens anteriores no confirmados del mismo prestador
        IdentityToken.objects.filter(lender=lender, is_confirmed=False).delete()
        token = IdentityToken.objects.create(lender=lender)
        return token


class IdentityConfirmSerializer(serializers.Serializer):
    """
    El frontend llama a este endpoint cuando el prestador presiona 'Ya confirmé'
    para verificar si el token fue confirmado vía el link del correo.
    """
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = IdentityToken.objects.get(token=value, is_confirmed=True)
        except IdentityToken.DoesNotExist:
            raise serializers.ValidationError('El token no existe o aún no ha sido confirmado.')
        self.context['token_obj'] = token_obj
        return value
