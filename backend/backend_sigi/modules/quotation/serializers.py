from rest_framework import serializers

from .models import Quotation


class QuotationSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para las cotizaciones.

    Todos los campos se llenan al subir el archivo (la vista sube el PDF a
    Supabase y guarda la URL), así que ninguno se escribe desde el cliente.
    """

    # Cuántos materiales la tienen enlazada. Sirve para avisar antes de
    # borrarla y para que el frontend deshabilite el botón cuando está en uso.
    materials_count = serializers.SerializerMethodField()

    def get_materials_count(self, obj):
        # Al listar, la vista trae el conteo ya anotado para no disparar una
        # consulta por fila (N+1). En el detalle se calcula al vuelo.
        anotado = getattr(obj, 'materials_count_annotated', None)
        if anotado is not None:
            return anotado
        return obj.material_links.count()

    class Meta:
        model = Quotation
        fields = ['id', 'file_url', 'file_name', 'uploaded_at', 'materials_count']
        read_only_fields = fields
