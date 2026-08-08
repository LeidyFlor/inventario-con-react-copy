from django.db import models


class Quotation(models.Model):
    """
    Una cotización = UN archivo PDF.

    En el módulo de Configuración se pueden subir varios archivos por tanda
    (ver MAX_ARCHIVOS_POR_TANDA en views.py), pero cada archivo queda como una
    cotización independiente de las demás: subirlos juntos no los agrupa.

    Después, cada material se enlaza de 1 a 3 cotizaciones a través de la tabla
    intermedia MaterialQuotation, que vive en la app materials junto a
    TechnicalSheetFile porque sigue el mismo patrón de dos claves foráneas.

    No lleva is_active: a diferencia de marca, inventario y categoría, aquí el
    cliente pidió borrado real. El borrado se bloquea si algún material la
    tiene enlazada (ver QuotationViewSet.destroy).
    """
    # URL pública del PDF en Supabase Storage, igual que las fichas técnicas
    file_url = models.URLField()
    # Nombre original del archivo, que es lo que se muestra en pantalla
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quotation'
        # verbose_name explícito: la pantalla de gestión de permisos solo
        # muestra los modelos que lo declaran (ver available_permissions)
        verbose_name = 'cotización'
        verbose_name_plural = 'cotizaciones'
        permissions = [
            # Django genera add_, view_, change_ y delete_ automáticamente.
            #
            # NO lleva 'generar_reporte': la cotización no tiene reporte propio.
            ('listar_quotation', 'Listar cotizaciones'),
        ]
        # Las más recientes primero, que es como se quieren ver al elegirlas
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file_name
