"""
Helper de auditoría — registra acciones de usuarios en la tabla audit_log.

Uso:
    from backend_sigi.utils.audit import log_action
    log_action(request.user, "CREAR", "Préstamo", "AAA000000015")

Antes escribía en un archivo de texto rotado a diario. Se movió a la base de
datos (ver modules/audit/models.py); la firma se mantuvo igual a propósito,
para no tocar las decenas de llamadas repartidas por las views.

El superusuario creado por consola nunca genera registros.
"""


def log_action(user, action: str, module: str, objeto: str):
    """
    Guarda una fila de auditoría.

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

    # Import diferido: este módulo lo importan las views, y a su vez los
    # modelos importan users. Traerlo arriba crearía un ciclo al arrancar.
    from backend_sigi.modules.audit.models import AuditLog

    try:
        AuditLog.objects.create(
            user=user,
            user_email=user.email,
            action=action,
            module=module,
            objeto=str(objeto)[:255],
        )
    except Exception as e:
        # La auditoría NUNCA debe tumbar la operación real. Si falla el insert,
        # se deja constancia en la consola y la petición sigue su curso: es
        # preferible perder una línea de log a que no se pueda crear un
        # préstamo.
        print(f"Error registrando auditoría ({action} {module}): {e}")
