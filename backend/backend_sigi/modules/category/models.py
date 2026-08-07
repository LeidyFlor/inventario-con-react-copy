from django.db import models


class Category(models.Model):
    """
    Categoría de un material.

    OJO con el nombre: hasta ahora "categoría" era la lista fija de
    herramienta / maquinaria / muebles de los materiales devolutivos. Esa lista
    pasó a llamarse TIPO DE MATERIAL (ReturnableMaterial.MATERIAL_TYPES) y sigue
    siendo fija, porque de ella dependen reglas de negocio.

    Esta categoría es otra cosa: una clasificación libre que el usuario
    administra desde Configuración, sin reglas asociadas, y que aplica a los
    dos tipos de material.

    Misma estructura que InventoryName: un campo de texto y el activo/inactivo.
    """
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'category'
        # verbose_name explícito: la pantalla de gestión de permisos solo
        # muestra los modelos que lo declaran (ver available_permissions)
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'
        permissions = [
            # Django genera add_, view_, change_ y delete_ automáticamente.
            #
            # NO lleva 'generar_reporte': la categoría no tiene reporte propio,
            # aparece como columna y filtro dentro del reporte de materiales.
            ('listar_category', 'Listar categorías'),
        ]

    def __str__(self):
        return self.name
