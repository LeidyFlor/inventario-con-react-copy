from django.apps import AppConfig


class InventoryNameConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # La ruta completa del módulo. Con solo 'inventory_name' Django no
    # encuentra la app, porque vive dentro del paquete backend_sigi.modules.
    name = 'backend_sigi.modules.inventory_name'
    # Sin esto el label sería 'inventory_name' igual, pero se deja explícito
    # porque de él dependen los codenames de los permisos
    # (inventory_name.listar_inventoryname, etc.)
    label = 'inventory_name'
