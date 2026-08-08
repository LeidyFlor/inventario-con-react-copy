from rest_framework import serializers

from backend_sigi.modules.users.models import Users
from backend_sigi.modules.quotation.models import Quotation
from backend_sigi.modules.quotation.serializers import QuotationSerializer

from .models import (
    Brand,
    ConsumableMaterial,
    MaterialQuotation,
    ReturnableMaterial,
    TechnicalSheetFile,
)


# Un material debe quedar enlazado de 1 a 3 cotizaciones. El mínimo y el
# máximo se validan aquí porque la base de datos no puede exigir una cantidad
# de filas relacionadas.
MIN_COTIZACIONES = 1
MAX_COTIZACIONES = 3


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
    # El inventario es obligatorio al crear y editar. En el modelo es nullable
    # solo para no romper los materiales anteriores a esta funcionalidad.
    'inventory_name':         {'required': True, 'allow_null': False},
    # La categoría también. Mismo criterio: nullable en el modelo solo por
    # los materiales anteriores a esta funcionalidad.
    'category':               {'required': True, 'allow_null': False},
}


# Campos que comparten los dos tipos de material y que se agregaron juntos.
# Se listan aquí para no repetirlos en los seis serializers.
CAMPOS_COMUNES_NUEVOS = [
    'material_model',
    'material_serial',
    'material_purchase_date',
    'material_entry_date',
    # Inventario al que pertenece. Obligatorio: se declara así en
    # CAMPOS_OPCIONALES_MATERIAL, que pese al nombre configura tanto los
    # opcionales como los que sí se exigen.
    'inventory_name',
    'category',
]


def nombre_legible(user):
    """Nombre completo del usuario, o su correo si no tiene nombre cargado."""
    return f"{user.first_name} {user.last_name}".strip() or user.email


class NombresLegiblesMixin(metaclass=serializers.SerializerMetaclass):
    """
    Expone el nombre del inventario y de la categoría además de sus ids.

    El id lo necesita el Select de los formularios; el nombre, las tablas, las
    pantallas de visualizar y el reporte. Se llama inventory_name_display para
    no chocar con el campo real, que es la clave foránea.

    Igual que en CuentadantesMixin, la metaclase es obligatoria: sin ella DRF
    no recoge los campos declarados en una clase base.
    """
    inventory_name_display = serializers.CharField(
        source='inventory_name.name', read_only=True
    )
    category_display = serializers.CharField(
        source='category.name', read_only=True
    )


class CotizacionesLecturaMixin(metaclass=serializers.SerializerMetaclass):
    """
    Expone las cotizaciones enlazadas al material, para las tablas, las
    pantallas de visualizar y el modal de selección.

    Igual que en los demás mixins, la metaclase es obligatoria: sin ella DRF
    no recoge los campos declarados en una clase base.
    """
    quotations = serializers.SerializerMethodField()

    def get_quotations(self, obj):
        # quotation_links es la tabla intermedia; de cada enlace se saca la
        # cotización en sí, que es lo que interesa mostrar
        cotizaciones = [enlace.quotation for enlace in obj.quotation_links.all()]
        return QuotationSerializer(cotizaciones, many=True).data


class CotizacionesEscrituraMixin(metaclass=serializers.SerializerMetaclass):
    """
    Recibe la lista de cotizaciones que se van a enlazar al material.

    Llega como 'quotation_ids' (una entrada por cotización, igual que los
    cuentadantes) y no es un campo del modelo, así que se saca de
    validated_data antes de guardar y los enlaces se crean aparte en la tabla
    intermedia.

    Al crear es obligatorio; al editar es opcional, y si no viene se dejan los
    enlaces como están (así un PATCH parcial no borra las cotizaciones sin
    querer).
    """
    quotation_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        required=False,
        queryset=Quotation.objects.all(),
    )

    def get_fields(self):
        """
        Vuelve el campo obligatorio solo al crear.

        La obligatoriedad NO puede ir en validate(): los cuatro serializers
        concretos definen el suyo propio y, al estar más abajo en la jerarquía,
        pisarían el de este mixin sin llamarlo. get_fields() no lo redefine
        ninguno, así que es el punto seguro.
        """
        fields = super().get_fields()
        campo = fields.get('quotation_ids')
        # self.instance es None al crear; al editar se dejan como están si no
        # vienen en la petición
        if campo is not None and self.instance is None:
            campo.required = True
            campo.allow_empty = False
        return fields

    def validate_quotation_ids(self, value):
        # set() para no contar dos veces la misma cotización repetida
        unicas = {c.pk for c in value}
        if len(unicas) < MIN_COTIZACIONES:
            raise serializers.ValidationError(
                f'Debes enlazar al menos {MIN_COTIZACIONES} cotización.'
            )
        if len(unicas) > MAX_COTIZACIONES:
            raise serializers.ValidationError(
                f'Solo se pueden enlazar hasta {MAX_COTIZACIONES} cotizaciones.'
            )
        return value

    def _sincronizar_cotizaciones(self, material, cotizaciones):
        """
        Deja el material enlazado exactamente a las cotizaciones recibidas.

        Se borran los enlaces anteriores y se crean los nuevos. Es más simple
        que calcular diferencias y el número de filas siempre es 3 o menos.
        """
        campo = (
            'consumable_material' if isinstance(material, ConsumableMaterial)
            else 'material'
        )
        material.quotation_links.all().delete()
        MaterialQuotation.objects.bulk_create([
            MaterialQuotation(quotation=cotizacion, **{campo: material})
            # dict.fromkeys en vez de set() para no perder el orden elegido
            for cotizacion in dict.fromkeys(cotizaciones)
        ])

    def create(self, validated_data):
        cotizaciones = validated_data.pop('quotation_ids', [])
        material = super().create(validated_data)
        self._sincronizar_cotizaciones(material, cotizaciones)
        return material

    def update(self, instance, validated_data):
        # None distingue "no vino en la petición" de "vino vacío"
        cotizaciones = validated_data.pop('quotation_ids', None)
        material = super().update(instance, validated_data)
        if cotizaciones is not None:
            self._sincronizar_cotizaciones(material, cotizaciones)
        return material


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

    # Los mismos cuentadantes pero como pares id/nombre. inventory_manager_name
    # sirve para mostrar, pero el MultiSelect del formulario de edición necesita
    # la etiqueta de cada id por separado para poder seguir mostrando a los que
    # ya no aparecen en /api/inventory-managers/.
    inventory_managers_display = serializers.SerializerMethodField()

    def get_inventory_manager_name(self, obj):
        return ", ".join(nombre_legible(u) for u in obj.inventory_managers.all())

    def get_inventory_managers_display(self, obj):
        return [
            {'id': u.id, 'label': nombre_legible(u), 'is_accountant': u.is_accountant}
            for u in obj.inventory_managers.all()
        ]

    def get_fields(self):
        """
        Amplía el queryset de inventory_managers a todos los usuarios.

        El modelo declara limit_choices_to={'is_accountant': True}, y DRF lo
        respeta al armar el campo. El problema: si a un usuario le quitan la
        marca de cuentadante, los materiales que ya tenía asignados dejan de
        poder guardarse. Al editarlos, el formulario reenvía su id y DRF
        responde 'Invalid pk - object does not exist'.

        La regla NO se pierde: validate_inventory_managers de abajo sigue
        exigiendo que todo cuentadante NUEVO lo sea de verdad. Lo único que se
        permite es conservar los que ya estaban.
        """
        fields = super().get_fields()
        campo = fields.get('inventory_managers')
        if campo is not None:
            campo.child_relation.queryset = Users.objects.all()
        return fields

    def validate_inventory_managers(self, value):
        if not value:
            raise serializers.ValidationError('Debes asignar al menos un cuentadante.')

        # Los que ya estaban asignados se conservan aunque hoy no sean
        # cuentadantes; solo se exige la marca a los que se agregan ahora
        ya_asignados = set()
        if self.instance is not None:
            ya_asignados = set(self.instance.inventory_managers.values_list('pk', flat=True))

        invalidos = [
            nombre_legible(u) for u in value
            if not u.is_accountant and u.pk not in ya_asignados
        ]
        if invalidos:
            raise serializers.ValidationError(
                'Estos usuarios no son cuentadantes: ' + ', '.join(invalidos)
            )
        return value

#para el crud de marcas
class BrandSerializer(serializers.ModelSerializer):

    # Cuántos materiales la tienen asignada, sumando los dos tipos.
    #
    # No impide desactivarla: sirve para avisar en pantalla a cuántos
    # materiales afecta antes de confirmar. Desactivar solo significa que deja
    # de ofrecerse al registrar materiales nuevos; los que ya la tienen la
    # conservan. Mismo criterio que inventario y categoría.
    materials_count = serializers.SerializerMethodField()

    def get_materials_count(self, obj):
        # Al listar, la vista trae el conteo ya anotado para no disparar dos
        # consultas por fila (N+1). En el detalle se calcula al vuelo.
        anotado = getattr(obj, 'materials_count_annotated', None)
        if anotado is not None:
            return anotado
        return obj.returnablematerial_set.count() + obj.consumablematerial_set.count()

    class Meta:
        model = Brand
        fields = ['id', 'name', 'is_active', 'materials_count']


# Serializer de fichas técnicas — se usa anidado en los DOS tipos de material.
# Va aquí arriba porque ConsumableMaterialSerializer también lo necesita.
class TechnicalSheetFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalSheetFile
        fields = ['id', 'file_url', 'file_name', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

#Para listar — incluye campos calculados y nombres legibles en vez de solo ids"
class ConsumableMaterialSerializer(NombresLegiblesMixin, CotizacionesLecturaMixin, CuentadantesMixin, serializers.ModelSerializer):

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
            'inventory_name_display',
            'category_display',
            'inventory_managers',
            'inventory_manager_name',
            'inventory_managers_display',
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
            'quotations',
        ]
        read_only_fields = ['id', 'material_quantity_loaned']

#Para crear — sin quantity_loaned (empieza en 0) ni state (empieza disponible)
class ConsumableMaterialCreateSerializer(CotizacionesEscrituraMixin, CuentadantesMixin, serializers.ModelSerializer):

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
            'quotation_ids',
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            # material_image NO va aquí — el archivo llega por request.FILES
            # y la view lo sube a Supabase y guarda la URL resultante
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL

#Para editar — permite cambiar is_active y state con sus validaciones
class ConsumableMaterialUpdateSerializer(CotizacionesEscrituraMixin, CuentadantesMixin, serializers.ModelSerializer):

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
            'quotation_ids',
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
class ReturnableMaterialSerializer(NombresLegiblesMixin, CotizacionesLecturaMixin, CuentadantesMixin, serializers.ModelSerializer):

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
            'inventory_name_display',
            'category_display',
            'inventory_managers',
            'inventory_manager_name',
            'inventory_managers_display',
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
            'material_type',
            'material_dimensions',
            'is_active',
            'material_state',
            'technical_files',
            'quotations',
        ]
        read_only_fields = ['id', 'material_quantity_loaned']


# Para crear
class ReturnableMaterialCreateSerializer(CotizacionesEscrituraMixin, CuentadantesMixin, serializers.ModelSerializer):

    # Cantidad opcional en el request — se calcula en validate()
    material_quantity = serializers.IntegerField(required=False, default=1)

    def validate(self, data):
        tipo = data.get('material_type', '')
        barcode  = data.get('material_barcode_sena', '').strip()

        # Placa SENA obligatoria para maquinaria y muebles; opcional para herramienta
        if tipo != 'herramienta' and not barcode:
            raise serializers.ValidationError({
                'material_barcode_sena': 'La placa SENA es obligatoria para este tipo de material.'
            })

        # Si tiene placa o el tipo NO es herramienta → cantidad forzada a 1
        if barcode or tipo != 'herramienta':
            data['material_quantity'] = 1
        else:
            # herramienta sin placa: cantidad debe ser >= 1
            qty = data.get('material_quantity', 1)
            if not qty or qty < 1:
                raise serializers.ValidationError({
                    'material_quantity': 'La cantidad debe ser mayor a 0.'
                })

        # Solo muebles_enseres puede tener dimensiones
        if data.get('material_dimensions') and tipo != 'muebles_enseres':
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
            'quotation_ids',
            'material_type',
            'material_dimensions',
            # material_image no va aquí — la view lo maneja vía request.FILES
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL


# Para editar — validaciones de estado + reglas por tipo de material
class ReturnableMaterialUpdateSerializer(CotizacionesEscrituraMixin, CuentadantesMixin, serializers.ModelSerializer):

    # Cantidad opcional — solo editable para herramienta sin placa
    material_quantity = serializers.IntegerField(required=False)

    def validate(self, data):
        is_active     = data.get('is_active', self.instance.is_active)
        material_state = data.get('material_state', self.instance.material_state)
        tipo          = data.get('material_type', self.instance.material_type)
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
        if tipo != 'herramienta' and not barcode:
            raise serializers.ValidationError({
                'material_barcode_sena': 'La placa SENA es obligatoria para este tipo de material.'
            })

        # Regla de cantidad
        if barcode or tipo != 'herramienta':
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
        if data.get('material_dimensions') and tipo != 'muebles_enseres':
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
            'quotation_ids',
            'material_type',
            'material_dimensions',
            'is_active',
            'material_state',
            # material_image no va aquí — la view lo maneja vía request.FILES
        ]
        extra_kwargs = CAMPOS_OPCIONALES_MATERIAL