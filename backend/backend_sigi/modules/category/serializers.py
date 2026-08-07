from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer para el CRUD de categorías."""

    # Cuántos materiales la tienen asignada, sumando los dos tipos.
    #
    # No impide desactivarla: sirve para avisar en pantalla a cuántos
    # materiales afecta antes de confirmar. Desactivar solo significa que deja
    # de ofrecerse al registrar materiales nuevos; los que ya la tienen la
    # conservan.
    materials_count = serializers.SerializerMethodField()

    def get_materials_count(self, obj):
        # Al listar, la vista trae el conteo ya anotado para no disparar dos
        # consultas por fila (N+1). En el detalle se calcula al vuelo.
        anotado = getattr(obj, 'materials_count_annotated', None)
        if anotado is not None:
            return anotado
        return obj.returnablematerial_set.count() + obj.consumablematerial_set.count()

    class Meta:
        model = Category
        fields = ['id', 'name', 'is_active', 'materials_count']

    def validate_name(self, value):
        """
        No se permiten dos categorías con el mismo nombre.

        Se compara sin distinguir mayúsculas ni espacios sobrantes, para que
        'Redes' y 'redes ' no convivan como si fueran distintas.
        """
        limpio = value.strip()
        if not limpio:
            raise serializers.ValidationError('El nombre es obligatorio.')

        existentes = Category.objects.filter(name__iexact=limpio)
        # Al editar hay que excluirse a sí misma, si no siempre chocaría
        if self.instance:
            existentes = existentes.exclude(pk=self.instance.pk)
        if existentes.exists():
            raise serializers.ValidationError('Ya existe una categoría con ese nombre.')

        return limpio
