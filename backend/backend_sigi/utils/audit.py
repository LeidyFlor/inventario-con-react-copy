"""
Helper de auditoría — registra acciones de usuarios en el archivo de log diario.
Uso:
    from backend_sigi.utils.audit import log_action
    log_action(request.user, "CREAR", "Préstamo", "AAA000000015")

El superusuario creado por consola nunca genera registros.
"""
import logging

_logger = logging.getLogger('audit')


def log_action(user, action: str, module: str, objeto: str):
    """
    Escribe una línea de auditoría.

    Args:
        user:    instancia del usuario que realiza la acción (request.user)
        action:  verbo en mayúsculas, ej: "CREAR", "EDITAR", "DESACTIVAR"
        module:  nombre legible del módulo, ej: "Préstamo", "Usuario"
        objeto:  identificador legible del objeto afectado, sin IDs internos
    """
    if not user or not user.is_authenticated:
        return
    if user.is_superuser:
        return  # El superadmin no deja registros

    _logger.info(
        f"usuario={user.email} | accion={action} | modulo={module} | objeto={objeto}"
    )
