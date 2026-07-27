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
