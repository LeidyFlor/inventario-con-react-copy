from django.db import models


class InventoryName(models.Model):
    """
    Nombre de inventario al que pertenece un material.

    Sirve para agrupar los materiales por inventario físico o por dependencia,
    y poder filtrar el reporte de materiales por ese criterio.

    Misma estructura que Brand: un solo campo de texto más el activo/inactivo.
    A diferencia de la marca, el nombre admite hasta 255 caracteres porque
    suelen ser descripciones largas y no una sola palabra.
    """
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inventory_name'
        # verbose_name explícito: la pantalla de gestión de permisos solo
        # muestra los modelos que lo declaran (ver available_permissions)
        verbose_name = 'nombre de inventario'
        verbose_name_plural = 'nombres de inventario'
        permissions = [
            # Django ya genera add_, view_, change_ y delete_ automáticamente.
            # Aquí solo se agrega el de listar, igual que en los demás módulos.
            #
            # NO lleva 'generar_reporte': el nombre de inventario no tiene
            # reporte propio, aparece como columna y como filtro dentro del
            # reporte de materiales, que ya tiene su propio permiso.
            ('listar_inventoryname', 'Listar nombres de inventario'),
        ]

    def __str__(self):
        return self.name
