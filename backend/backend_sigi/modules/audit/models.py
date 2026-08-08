from django.db import models

from backend_sigi.modules.users.models import Users


class AuditLog(models.Model):
    """
    Registro de acciones de los usuarios sobre el sistema.

    Antes esto vivía en un archivo de texto rotado a diario. Se movió a la base
    de datos por tres razones concretas:

      - El archivo se pierde en cada despliegue si el hosting usa contenedores.
      - En Windows el autoreloader levanta DOS procesos escribiendo el mismo
        archivo, y en la rotación de medianoche uno falla por permisos.
      - Consultarlo obligaba a descargar un .log plano; en tabla se puede
        filtrar por usuario y por fechas.

    OJO: el superadministrador sigue sin dejar registro (ver log_action). Es
    una decisión del proyecto, no un olvido.
    """

    # SET_NULL y no CASCADE: si algún día se borra un usuario, el rastro de lo
    # que hizo debe sobrevivir. Para eso está también user_email.
    user = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs',
    )
    # Copia del correo al momento de la acción. Si el usuario se borra o cambia
    # de correo, el registro sigue diciendo quién fue en ese momento.
    user_email = models.EmailField()

    # Verbo en mayúsculas: CREAR, EDITAR, DESACTIVAR, DEVOLVER, DESENLAZAR...
    action = models.CharField(max_length=30)
    # Nombre legible del módulo: Préstamo, Usuario, Marca...
    module = models.CharField(max_length=50)
    # Identificador legible del objeto afectado, sin ids internos
    objeto = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_log'
        # SIN verbose_name y SIN permisos propios: la descarga del historial ya
        # se controla con is_staff / is_superuser, y declarar verbose_name haría
        # aparecer el modelo en la pantalla de gestión de permisos.
        default_permissions = ()
        # Lo más reciente primero, que es como se consulta siempre
        ordering = ['-created_at']
        indexes = [
            # El filtro habitual es por rango de fechas
            models.Index(fields=['-created_at'], name='audit_log_creado_idx'),
        ]

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} | {self.user_email} | {self.action} {self.module}"
