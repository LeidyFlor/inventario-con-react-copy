"""
Descarga del historial de auditoría.

GET /api/audit/download/                       → todo lo del día de hoy
GET /api/audit/download/?date=2026-07-25       → un día concreto
GET /api/audit/download/?desde=2026-07-01&hasta=2026-07-31  → un rango

Solo superusuarios y staff pueden acceder.

Antes leía un archivo .log del disco. Ahora arma el texto desde la tabla
audit_log, así que la ruta y el formato de salida se conservan y el botón de
"Historial" del frontend sigue funcionando igual.
"""
from datetime import date, datetime, timedelta

from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


def _parse_fecha(texto):
    """Convierte 'YYYY-MM-DD' en date, o None si no es válida."""
    try:
        return datetime.strptime(texto, '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_audit_log(request):
    # Solo superusuario o staff pueden descargar el historial
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({'error': 'No tienes permiso para descargar los logs.'}, status=403)

    from backend_sigi.modules.audit.models import AuditLog

    params = request.query_params

    # Un día suelto (?date=) o un rango (?desde= &hasta=). Por defecto, hoy.
    if params.get('desde') or params.get('hasta'):
        desde = _parse_fecha(params.get('desde')) or date.min
        hasta = _parse_fecha(params.get('hasta')) or timezone.localdate()
        etiqueta = f"{desde}_a_{hasta}"
    else:
        dia = _parse_fecha(params.get('date')) or timezone.localdate()
        desde = hasta = dia
        etiqueta = str(dia)

    if desde > hasta:
        return JsonResponse(
            {'error': 'La fecha inicial no puede ser posterior a la final.'},
            status=400,
        )

    # created_at es un DateTimeField: se compara contra el rango completo del
    # día, no contra la fecha suelta, o se perderían los registros de las horas
    # posteriores al corte
    inicio = timezone.make_aware(datetime.combine(desde, datetime.min.time()))
    fin    = timezone.make_aware(datetime.combine(hasta + timedelta(days=1), datetime.min.time()))

    registros = (
        AuditLog.objects
        .filter(created_at__gte=inicio, created_at__lt=fin)
        .order_by('created_at')
    )

    if not registros.exists():
        return JsonResponse(
            {'error': f'No hay registros de auditoría para {etiqueta}.'},
            status=404,
        )

    # Mismo formato de línea que tenía el archivo, para no romper la costumbre
    # de quien ya venía leyendo estos archivos
    lineas = [
        f"{timezone.localtime(r.created_at):%Y-%m-%d %H:%M:%S} | INFO | "
        f"usuario={r.user_email} | accion={r.action} | "
        f"modulo={r.module} | objeto={r.objeto}"
        for r in registros
    ]

    response = HttpResponse(
        "\n".join(lineas) + "\n",
        content_type='text/plain; charset=utf-8',
    )
    response['Content-Disposition'] = f'attachment; filename="audit-{etiqueta}.log"'
    return response
