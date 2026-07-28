"""
Endpoint para descargar el log de auditoría del día actual.
GET /api/audit/download/          → descarga audit.log (día actual)
GET /api/audit/download/?date=2026-07-25  → descarga el log de esa fecha
Solo superusuarios y staff pueden acceder.
"""
import os
from datetime import date
from django.conf import settings
from django.http import FileResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_audit_log(request):
    # Solo superusuario o staff pueden descargar logs
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({'error': 'No tienes permiso para descargar los logs.'}, status=403)

    logs_dir = settings.LOGS_DIR
    fecha = request.query_params.get('date', str(date.today()))

    # El archivo del día actual se llama audit.log
    # Los rotados se llaman audit.log.YYYY-MM-DD
    if fecha == str(date.today()):
        log_path = logs_dir / 'audit.log'
    else:
        log_path = logs_dir / f'audit.log.{fecha}'

    if not log_path.exists():
        return JsonResponse({'error': f'No hay log disponible para la fecha {fecha}.'}, status=404)

    response = FileResponse(
        open(log_path, 'rb'),
        content_type='text/plain; charset=utf-8',
    )
    response['Content-Disposition'] = f'attachment; filename="audit-{fecha}.log"'
    return response
