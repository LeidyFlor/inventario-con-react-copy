from rest_framework import serializers
from .models import Brand, ConsumableMaterial, ReturnableMaterial, TechnicalSheetFile


# La marca y el modelo son opcionales en los dos tipos de material: hay
# insumos genéricos sin marca identificable. Se declara aquí una sola vez para
# no repetir la misma configuración en los cuatro serializers de escritura.
#
# allow_null en brand porque es una ForeignKey y el formulario manda vacío
# cuando no se elige ninguna; allow_blank en material_model porque es texto.
CAMPOS_OPCIONALES_MATERIAL = {
    'brand':           {'required': False, 'allow_null': True},
    'material_model':  {'required': False, 'allow_blank': True},
    'material_serial': {'required': False, 'allow_blank': True},
    # Las fechas de compra e ingreso son obligatorias en el formulario. En el
    # modelo son nullable solo para no inventarle una fecha a los materiales
    # que ya existían antes de agregar estos campos.
    'material_purchase_date': {'required': True, 'allow_null': False},
    'material_entry_date':    {'required': True, 'allow_null': False},
}


# Campos que comparten los dos tipos de material y que se agregaron juntos.
# Se listan aquí para no repetirlos en los seis serializers.
CAMPOS_COMUNES_NUEVOS = [
    'material_model',
    'material_serial',
    'material_purchase_date',
    'material_entry_date',
]


def nombre_legible(user):
    """Nombre completo del usuario, o su correo si no tiene nombre cargado."""
    return f"{user.first_name} {user.last_name}".strip() or user.email


class CuentadantesMixin(metaclass=serializers.SerializerMetaclass):
    """
    Un material puede estar a cargo de varios cuentadantes, y al menos uno es
    obligatorio.

    inventory_manager_name se conserva con ese nombre (en singular) para no
    romper las tablas, los reportes ni la pantalla de préstamos, que ya lo
    consumen. Ahora devuelve los nombres separados por coma.

    El metaclass=SerializerMetaclass es obligatorio: DRF solo recoge los campos
    declarados de las clases base que lo tengan. Sin él, el
    SerializerMethodField de abajo se ignora y el serializer falla al buscar
    'inventory_manager_name' como campo del modelo.
    """
    inventory_manager_name = serializers.SerializerMethodField()

    def get_inventory_manager_name(self, obj):
        return ", ".join(nombre_legible(u) for u in obj.inventory_managers.all())

    def validate_inventory_managers(self, value):
        if not value:
            raise serializers.ValidationError('Debes asignar al menos un cuentadante.')
        return value

#para el crud de marcas
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'is_active']


# Serializer de fichas técnicas — se usa anidado en los DOS tipos de material.
# Va aquí arriba porque ConsumableMaterialSerializer también lo necesita.
class TechnicalSheetFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalSheetFile
        fields = ['id', 'file_url', 'file_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

#Para listar — incluye campos calculados y nombres legibles en vez de solo ids"
class ConsumableMaterialSerializer(CuentadantesMixin, serializers.ModelSerializer):

    # Campos calculados (@property del modelo) — read_only porque no se guardan en BD
    material_total_price = serializers.SerializerMethodField()
    material_quantity_available = serializers.SerializerMethodField()

    # Nombres legibles — source indica de dónde sacar el valor
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    # Fichas técnicas anidadas — igual que en devolutivo. Solo lectura: se
    # gestionan con las acciones upload/delete del ViewSet.
    technical_files = TechnicalSheetFileSerializer(many=True, read_only=True)

    def get_material_total_price(self, obj):
        return obj.material_total_price  # llama al @property del modelo

    def get_material_quantity_available(self, obj):
        return obj.material_quantity_available

    class Meta:
        model = ConsumableMaterial
        fields = [
            'id',
            'brand',           # ID de la marca (para edición)
            'brand_name',      # Nombre legible (para mostrar)
            'inventory_managers',
            'inventory_manager_name',
            'material_name',
            'material_description',
            *CAMPOS_COMUNES_NUEVOS,
            'material_barcode_sena',
            'material_quantity',
            'material_quantity_loaned',
            'material_quantity_available',
            'material_unit_price',
            'material_total_price',
            'material_location',
            'material_image',
            'is_active',
            'material_state',
            'technical_files',
        ]
        read_only_fields = ['id', 'material_quantity_loaned']

#Para crear — sin quantity_loaned (empieza en 0) ni state (empieza disponible)
class ConsumableMaterialCreateSerializer(CuentadantesMixin, serializers.ModelSerializer):

    def validate(self, data):
        # Si tiene placa SENA la cantidad debe ser exactamente 1
        if data.get('material_barcode_sena') and data.get('material_quantity') != 1:
            raise serializers.ValidationError({
                'material_quantity': 'Un material con placa SENA debe tener cantidad 1.'
            })
        return data

    class Meta:
        model = ConsumableMaterial
        fields = [
            'brand',
            'inventory_managers',
            'material_name',
            'material_description',
            *CAMPOS_COMUNES_NUEVOS,
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            # material_image NO va aquí — el archivo llega por request.FILES
            # y la view lo sube a Supabase y guarda la URL resultante
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL

#Para editar — permite cambiar is_active y state con sus validaciones
class ConsumableMaterialUpdateSerializer(CuentadantesMixin, serializers.ModelSerializer):

    def validate(self, data):
        # self.instance es el objeto actual en BD (disponible en updates)
        is_active = data.get('is_active', self.instance.is_active)
        material_state = data.get('material_state', self.instance.material_state)

        # Si se desactiva, debe indicar el motivo
        if not is_active and not material_state:
            raise serializers.ValidationError({
                'material_state': 'Debe indicar el motivo cuando el material no está disponible.'
            })

        # Si se reactiva, se limpia el estado automáticamente
        if is_active:
            data['material_state'] = None

        # Validar placa SENA en edición también
        barcode = data.get('material_barcode_sena', self.instance.material_barcode_sena)
        quantity = data.get('material_quantity', self.instance.material_quantity)
        if barcode and quantity != 1:
            raise serializers.ValidationError({
                'material_quantity': 'Un material con placa SENA debe tener cantidad 1.'
            })

        return data

    class Meta:
        model = ConsumableMaterial
        fields = [
            'brand',
            'inventory_managers',
            'material_name',
            'material_description',
            *CAMPOS_COMUNES_NUEVOS,
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            'is_active',
            'material_state',
            # material_image no va aquí — la view lo maneja vía request.FILES
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL


# ──────────────────────────────────────────────────────────────────────────────
# MATERIAL DEVOLUTIVO
# ──────────────────────────────────────────────────────────────────────────────

# Para listar/ver detalle — expone fichas técnicas y nombres legibles
class ReturnableMaterialSerializer(CuentadantesMixin, serializers.ModelSerializer):

    # Campos calculados heredados del modelo abstracto
    material_total_price = serializers.SerializerMethodField()
    material_quantity_available = serializers.SerializerMethodField()

    # Nombres legibles para FK
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    # Fichas técnicas anidadas (solo lectura — se gestionan con acciones separadas)
    technical_files = TechnicalSheetFileSerializer(many=True, read_only=True)

    def get_material_total_price(self, obj):
        # Siempre será igual al precio unitario (quantity=1 en devolutivos)
        return obj.material_total_price

    def get_material_quantity_available(self, obj):
        return obj.material_quantity_available

    class Meta:
        model = ReturnableMaterial
        fields = [
            'id',
            'brand',
            'brand_name',
            'inventory_managers',
            'inventory_manager_name',
            'material_name',
            'material_description',
            'material_barcode_sena',   # obligatorio en devolutivos
            'material_quantity',       # siempre 1
            'material_quantity_loaned',
            'material_quantity_available',
            'material_unit_price',
            'material_total_price',
            'material_location',
            'material_image',
            *CAMPOS_COMUNES_NUEVOS,
            'material_category',
            'material_dimensions',
            'is_active',
            'material_state',
            'technical_files',
        ]
        read_only_fields = ['id', 'material_quantity_loaned']


# Para crear
class ReturnableMaterialCreateSerializer(CuentadantesMixin, serializers.ModelSerializer):

    # Cantidad opcional en el request — se calcula en validate()
    material_quantity = serializers.IntegerField(required=False, default=1)

    def validate(self, data):
        category = data.get('material_category', '')
        barcode  = data.get('material_barcode_sena', '').strip()

        # Placa SENA obligatoria para maquinaria y muebles; opcional para herramienta
        if category != 'herramienta' and not barcode:
            raise serializers.ValidationError({
                'material_barcode_sena': 'La placa SENA es obligatoria para esta categoría.'
            })

        # Si tiene placa o categoría NO es herramienta → cantidad forzada a 1
        if barcode or category != 'herramienta':
            data['material_quantity'] = 1
        else:
            # herramienta sin placa: cantidad debe ser >= 1
            qty = data.get('material_quantity', 1)
            if not qty or qty < 1:
                raise serializers.ValidationError({
                    'material_quantity': 'La cantidad debe ser mayor a 0.'
                })

        # Solo muebles_enseres puede tener dimensiones
        if data.get('material_dimensions') and category != 'muebles_enseres':
            data['material_dimensions'] = None

        return data

    class Meta:
        model = ReturnableMaterial
        fields = [
            'brand',
            'inventory_managers',
            'material_name',
            'material_description',
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            *CAMPOS_COMUNES_NUEVOS,
            'material_category',
            'material_dimensions',
            # material_image no va aquí — la view lo maneja vía request.FILES
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL


# Para editar — validaciones de estado + reglas de categoría
class ReturnableMaterialUpdateSerializer(CuentadantesMixin, serializers.ModelSerializer):

    # Cantidad opcional — solo editable para herramienta sin placa
    material_quantity = serializers.IntegerField(required=False)

    def validate(self, data):
        is_active     = data.get('is_active', self.instance.is_active)
        material_state = data.get('material_state', self.instance.material_state)
        category      = data.get('material_category', self.instance.material_category)
        barcode       = (data.get('material_barcode_sena') or self.instance.material_barcode_sena or '').strip()

        # Desactivar requiere motivo
        if not is_active and not material_state:
            raise serializers.ValidationError({
                'material_state': 'Debe indicar el motivo cuando el material no está disponible.'
            })

        # Reactivar limpia el estado
        if is_active:
            data['material_state'] = None

        # Placa SENA obligatoria para maquinaria y muebles; opcional para herramienta
        if category != 'herramienta' and not barcode:
            raise serializers.ValidationError({
                'material_barcode_sena': 'La placa SENA es obligatoria para esta categoría.'
            })

        # Regla de cantidad
        if barcode or category != 'herramienta':
            # Tiene placa o no es herramienta → siempre 1
            data['material_quantity'] = 1
        else:
            # herramienta sin placa → usar valor enviado o mantener el actual
            qty = data.get('material_quantity', self.instance.material_quantity)
            if not qty or qty < 1:
                raise serializers.ValidationError({
                    'material_quantity': 'La cantidad debe ser mayor a 0.'
                })
            data['material_quantity'] = qty

        # Dimensiones solo aplican a muebles_enseres
        if data.get('material_dimensions') and category != 'muebles_enseres':
            data['material_dimensions'] = None

        return data

    class Meta:
        model = ReturnableMaterial
        fields = [
            'brand',
            'inventory_managers',
            'material_name',
            'material_description',
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            *CAMPOS_COMUNES_NUEVOS,
            'material_category',
            'material_dimensions',
            'is_active',
            'material_state',
            # material_image no va aquí — la view lo maneja vía request.FILES
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL