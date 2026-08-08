from django.conf import settings
from django.db.models import Count
from django.utils import timezone
import requests as http_requests

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from backend_sigi.utils.audit import log_action
from backend_sigi.utils.perm_check import deny_if_no_perm

from .models import Quotation
from .serializers import QuotationSerializer


# Mismo bucket que las fichas técnicas: los dos son documentos de material y
# comparten las mismas reglas de acceso público
BUCKET = 'material-data-sheet'

# Tope de archivos que se pueden subir de una sola vez.
#
# OJO: no es el tope de cotizaciones por material. Ese es otro número y vive en
# materials/serializers.py (MIN_COTIZACIONES / MAX_COTIZACIONES). Son
# independientes a propósito: aquí se pueden cargar 6 archivos de golpe aunque
# cada material solo pueda enlazar 3.
MAX_ARCHIVOS_POR_TANDA = 6


def subir_cotizaciones(files):
    """
    Sube los PDF a Supabase Storage y crea una Quotation por cada uno.

    Cada archivo es una cotización independiente: no se agrupan, aunque se
    hayan subido juntos.

    Devuelve la lista de registros creados, ya serializados.
    """
    creados = []
    for archivo in files:
        marca_tiempo = timezone.now().strftime('%Y%m%d_%H%M%S%f')
        file_name = f"cotizaciones/{marca_tiempo}_{archivo.name}"

        response = http_requests.post(
            f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET}/{file_name}",
            headers={
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                'apikey': settings.SUPABASE_SERVICE_KEY,
                'Content-Type': archivo.content_type,
            },
            data=archivo.read()
        )
        if response.status_code in (200, 201):
            url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{file_name}"
            registro = Quotation.objects.create(file_url=url, file_name=archivo.name)
            creados.append(QuotationSerializer(registro).data)

    return creados


def borrar_cotizacion_de_storage(quotation):
    """Elimina el PDF de Supabase. El registro se borra aparte."""
    try:
        ruta = quotation.file_url.split(f'/public/{BUCKET}/')[1]
    except IndexError:
        # URL con otro formato (subida a mano, migrada, etc.): no hay nada que
        # borrar en el storage, pero el registro sí se puede eliminar
        return

    http_requests.delete(
        f"{settings.SUPABASE_URL}/storage/v1/object/{BUCKET}/{ruta}",
        headers={
            'Authorization': f'Bearer {settings.SUPABASE_SERVICE_KEY}',
            'apikey': settings.SUPABASE_SERVICE_KEY,
        }
    )


class QuotationViewSet(viewsets.ViewSet):
    """
    GET    /api/quotations/       - listar cotizaciones
    POST   /api/quotations/       - subir varios PDF (uno por cotización)
    GET    /api/quotations/{id}/  - detalle
    POST   /api/quotations/{id}/unlink-materials/ - quitarla de todos los materiales
    DELETE /api/quotations/{id}/  - eliminar de verdad, si no está en uso

    A diferencia de marcas, inventarios y categorías, aquí el borrado es real:
    se elimina el registro y el archivo del storage. Por eso se bloquea cuando
    algún material la tiene enlazada, para no dejarlo sin cotizaciones.
    """

    def list(self, request):
        deny = deny_if_no_perm(request, 'quotation.listar_quotation')
        if deny: return deny
        # El conteo va anotado para que el serializer no consulte por cada fila
        cotizaciones = Quotation.objects.annotate(
            materials_count_annotated=Count('material_links')
        )
        return Response(QuotationSerializer(cotizaciones, many=True).data)

    def retrieve(self, request, pk=None):
        deny = deny_if_no_perm(request, 'quotation.view_quotation')
        if deny: return deny
        try:
            cotizacion = Quotation.objects.get(pk=pk)
        except Quotation.DoesNotExist:
            return Response(
                {'error': 'Cotización no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(QuotationSerializer(cotizacion).data)

    def create(self, request):
        """
        Los archivos llegan en request.FILES bajo la clave 'files', igual que
        las fichas técnicas. No pasan por un serializer porque no son campos
        del modelo.
        """
        deny = deny_if_no_perm(request, 'quotation.add_quotation')
        if deny: return deny

        archivos = request.FILES.getlist('files')

        if not archivos:
            return Response(
                {'files': 'Debes adjuntar al menos un archivo PDF.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(archivos) > MAX_ARCHIVOS_POR_TANDA:
            return Response(
                {'files': f'Solo se pueden subir hasta {MAX_ARCHIVOS_POR_TANDA} archivos a la vez.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Solo PDF: se valida aquí porque el frontend puede saltarse el accept
        no_pdf = [a.name for a in archivos if not a.name.lower().endswith('.pdf')]
        if no_pdf:
            return Response(
                {'files': f"Solo se admiten archivos PDF. Revisa: {', '.join(no_pdf)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        creadas = subir_cotizaciones(archivos)
        if not creadas:
            return Response(
                {'error': 'No se pudo subir ningún archivo. Intenta de nuevo.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        log_action(
            request.user, "CREAR", "Cotización",
            ", ".join(c['file_name'] for c in creadas),
        )
        return Response(creadas, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='unlink-materials')
    def unlink_materials(self, request, pk=None):
        """
        POST /api/quotations/{id}/unlink-materials/

        Quita la cotización de TODOS los materiales que la tengan enlazada.

        Existe para poder eliminar una cotización que está en uso: destroy() la
        bloquea mientras haya materiales apuntando a ella, y desenlazarlos uno
        por uno desde cada material sería impracticable.

        OJO: los materiales que solo tenían esta cotización quedan sin ninguna,
        por debajo del mínimo de 1. Se pueden seguir consultando, pero al
        editarlos habrá que asignarles otra antes de guardar. Por eso la
        respuesta informa cuántos quedaron en esa situación y el frontend lo
        advierte antes de confirmar.

        Usa el permiso de cambio, no el de borrado: desenlazar modifica los
        materiales, no elimina la cotización.
        """
        deny = deny_if_no_perm(request, 'quotation.change_quotation')
        if deny: return deny

        try:
            cotizacion = Quotation.objects.get(pk=pk)
        except Quotation.DoesNotExist:
            return Response(
                {'error': 'Cotización no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )

        enlaces = cotizacion.material_links.all()
        total = enlaces.count()
        if total == 0:
            return Response({
                'message': 'La cotización no estaba enlazada a ningún material.',
                'unlinked': 0,
                'left_without': 0,
            })

        # Cuántos materiales quedarán sin ninguna cotización: los que solo
        # tienen este enlace. Se calcula ANTES de borrar.
        sin_ninguna = sum(
            1 for enlace in enlaces.select_related('material', 'consumable_material')
            if enlace.owner and enlace.owner.quotation_links.count() == 1
        )

        enlaces.delete()
        log_action(
            request.user, "DESENLAZAR", "Cotización",
            f"{cotizacion.file_name} — {total} material(es)",
        )
        return Response({
            'message': f'Se desenlazó de {total} material(es).',
            'unlinked': total,
            'left_without': sin_ninguna,
        })

    def destroy(self, request, pk=None):
        deny = deny_if_no_perm(request, 'quotation.delete_quotation')
        if deny: return deny

        try:
            cotizacion = Quotation.objects.get(pk=pk)
        except Quotation.DoesNotExist:
            return Response(
                {'error': 'Cotización no encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # El borrado es real, así que no se permite si algún material la usa:
        # quedaría sin la cotización y el mínimo de 1 dejaría de cumplirse
        en_uso = cotizacion.material_links.count()
        if en_uso:
            return Response(
                {'error': f'No se puede eliminar: hay {en_uso} material(es) '
                          f'enlazados a esta cotización. Desenlázala de ellos primero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nombre = cotizacion.file_name
        borrar_cotizacion_de_storage(cotizacion)
        cotizacion.delete()
        log_action(request.user, "ELIMINAR", "Cotización", nombre)
        return Response({'message': 'Cotización eliminada correctamente'})
