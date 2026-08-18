"""
Notificaciones del sistema.

GET /api/notifications/   → lo que le corresponde ver al usuario en sesión

NO hay tabla de notificaciones a propósito: todo se arma al vuelo desde Task y
Loan, que ya tienen la información. Una tabla aparte obligaría a mantenerla
sincronizada con esos dos módulos y a poblarla con datos duplicados.

Lo que devuelve depende de los permisos:

  - Tareas: para cualquier usuario autenticado. Las suyas y las de los grupos
    a los que pertenece.
  - Préstamos: solo para quien pueda listarlos Y verlos. Se piden los dos
    porque cada línea enlaza a la pantalla de ver el préstamo; sin el permiso
    de ver, el enlace terminaría en "Acceso denegado".
"""
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Cuántos elementos se muestran de cada tipo. El requisito pide 5 préstamos;
# se usa el mismo tope en tareas para que el menú no crezca sin control.
MAX_POR_TIPO = 5

# Estados de tarea que se notifican. Una tarea completada o cancelada ya no
# necesita recordarse.
ESTADOS_TAREA_ACTIVOS = ['pendiente', 'en_progreso']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications(request):
    from backend_sigi.modules.loans.models import Loan
    from backend_sigi.modules.tasks.models import Task

    user = request.user
    items = []

    # ── Tareas ────────────────────────────────────────────────────────────
    # Una tarea se asigna a un usuario O a un grupo (ver el CheckConstraint del
    # modelo). Mirar solo task.user dejaría por fuera las asignadas al grupo,
    # que es justo como se reparten las masivas.
    tareas = (
        Task.objects
        .filter(
            Q(user=user) | Q(group__in=user.groups.all()),
            task_state__in=ESTADOS_TAREA_ACTIVOS,
        )
        .distinct()
        .order_by('-created_at')[:MAX_POR_TIPO]
    )

    ESTADOS_TAREA = dict(Task.TASK_STATES)
    for t in tareas:
        items.append({
            'tipo': 'tarea',
            'titulo': t.task_name,
            'detalle': f"{ESTADOS_TAREA.get(t.task_state, t.task_state)} · vence {t.task_date_end:%d/%m/%Y}",
            # Mi perfil ya lista las tareas propias y las de grupo, y sabe
            # abrirlas en un modal. El parámetro le dice cuál desplegar.
            'destino': f"/dashboard/my-profile?tarea={t.id}",
            'fecha': t.created_at,
        })

    # ── Préstamos ─────────────────────────────────────────────────────────
    puede_ver_prestamos = (
        user.has_perm('loans.listar_loan') and user.has_perm('loans.view_loan')
    )
    if puede_ver_prestamos:
        prestamos = Loan.objects.order_by('-created_at')[:MAX_POR_TIPO]

        ESTADOS_LOAN = dict(Loan.LOAN_STATUSES)
        for p in prestamos:
            items.append({
                'tipo': 'prestamo',
                # El código visible (AAA000000011), no el id interno
                'titulo': p.loan_code,
                'detalle': ESTADOS_LOAN.get(p.loan_status, p.loan_status),
                'destino': f"/dashboard/loans/{p.id}/view",
                'fecha': p.created_at,
            })

    # Lo más reciente primero, mezclando tareas y préstamos
    items.sort(key=lambda i: i['fecha'], reverse=True)

    return Response({
        'items': items,
        # El frontend lo usa para decidir si enciende el punto del BellDot,
        # comparándolo con la última vez que se abrió el menú
        'ultima_fecha': items[0]['fecha'] if items else None,
    })
