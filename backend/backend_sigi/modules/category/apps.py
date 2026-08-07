from django.apps import AppConfig


class CategoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Ruta completa del módulo: la app vive dentro de backend_sigi.modules
    name = 'backend_sigi.modules.category'
    # Explícito porque de él dependen los codenames de los permisos
    # (category.listar_category, category.add_category, etc.)
    label = 'category'
