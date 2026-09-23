from django.apps import AppConfig


class ConfigurationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Ruta completa del módulo: la app vive dentro de backend_sigi.modules
    name = 'backend_sigi.modules.configuration'
    label = 'configuration'
