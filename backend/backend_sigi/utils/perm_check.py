"""
Helper para verificar permisos de Django en las views de DRF.

Uso:
    from backend_sigi.utils.perm_check import deny_if_no_perm

    def list(self, request):
        deny = deny_if_no_perm(request, 'materials.listar_brand')
        if deny: return deny
        ...

Los superusuarios siempre pasan (Django lo maneja automáticamente en has_perm).
"""
from rest_framework.response import Response
from rest_framework import status


def usuarios_con_permiso(perm: str):
    """
    Usuarios activos que tienen el permiso indicado, por grupo o individual.

    Sirve para llenar selects de personas habilitadas para algo, en vez de
    apoyarse en una bandera del modelo. Por ejemplo, el prestador de un
    préstamo: antes se limitaba a is_accountant, y ahora es cualquiera con
    'loans.add_loan'.

    Los superusuarios se incluyen siempre: has_perm() les devuelve True para
    todo, pero no tienen filas en las tablas de permisos, así que una consulta
    normal los dejaría por fuera.

    @param perm  Permiso en formato 'app_label.codename'
    """
    from django.contrib.auth import get_user_model
    from django.db.models import Q

    Users = get_user_model()
    app_label, _, codename = perm.partition('.')

    return Users.objects.filter(
        Q(groups__permissions__codename=codename,
          groups__permissions__content_type__app_label=app_label) |
        Q(user_permissions__codename=codename,
          user_permissions__content_type__app_label=app_label) |
        Q(is_superuser=True),
        is_active=True,
    # distinct() es obligatorio: un usuario con el permiso en dos grupos
    # aparecería repetido por el JOIN
    ).distinct()


def deny_if_no_perm(request, perm: str):
    """
    Retorna un Response 403 si el usuario no tiene el permiso indicado.
    Retorna None si el usuario sí tiene el permiso.
    """
    if not request.user.has_perm(perm):
        return Response(
            {'error': 'No tienes permiso para realizar esta acción.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None
