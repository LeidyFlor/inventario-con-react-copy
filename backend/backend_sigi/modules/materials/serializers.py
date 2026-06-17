from rest_framework import serializers
from .models import Brand, ConsumableMaterial

#para el crud de marcas
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'is_active']

#Para listar — incluye campos calculados y nombres legibles en vez de solo ids"
class ConsumableMaterialSerializer(serializers.ModelSerializer):

    # Campos calculados (@property del modelo) — read_only porque no se guardan en BD
    material_total_price = serializers.SerializerMethodField()
    material_quantity_available = serializers.SerializerMethodField()

    # Nombres legibles — source indica de dónde sacar el valor
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    inventory_manager_name = serializers.SerializerMethodField()

    def get_material_total_price(self, obj):
        return obj.material_total_price  # llama al @property del modelo

    def get_material_quantity_available(self, obj):
        return obj.material_quantity_available

    def get_inventory_manager_name(self, obj):
        return f"{obj.inventory_manager.first_name} {obj.inventory_manager.last_name}"

    class Meta:
        model = ConsumableMaterial
        fields = [
            'id',
            'brand',           # ID de la marca (para edición)
            'brand_name',      # Nombre legible (para mostrar)
            'inventory_manager',
            'inventory_manager_name',
            'material_name',
            'material_description',
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
        ]
        read_only_fields = ['id', 'material_quantity_loaned']

#Para crear — sin quantity_loaned (empieza en 0) ni state (empieza disponible)
class ConsumableMaterialCreateSerializer(serializers.ModelSerializer):

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
            'inventory_manager',
            'material_name',
            'material_description',
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            'material_image',
        ]

#Para editar — permite cambiar is_active y state con sus validaciones
class ConsumableMaterialUpdateSerializer(serializers.ModelSerializer):

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
            'inventory_manager',
            'material_name',
            'material_description',
            'material_barcode_sena',
            'material_quantity',
            'material_unit_price',
            'material_location',
            'material_image',
            'is_active',
            'material_state',
        ]