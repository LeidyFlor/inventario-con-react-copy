from django.apps import AppConfig


class QuotationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # Ruta completa del módulo: la app vive dentro de backend_sigi.modules
    name = 'backend_sigi.modules.quotation'
    # Explícito porque de él dependen los codenames de los permisos
    # (quotation.listar_quotation, quotation.add_quotation, etc.)
    label = 'quotation'
