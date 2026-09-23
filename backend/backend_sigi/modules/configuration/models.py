from django.db import models

from backend_sigi.modules.users.models import Users


class SystemConfig(models.Model):
    """
    Ajustes globales del sistema. Una sola fila, siempre con id = 1.

    El patrón se llama singleton: en vez de guardar un historial de valores, la
    tabla contiene el valor vigente y nada más. Cambiar el correo de soporte es
    un UPDATE sobre esa fila, así que el anterior se reemplaza solo — que es
    justo lo que se pidió, sin tener que borrar nada a mano.

    El id fijo lo garantiza save(), no la confianza en quien llame: aunque
    alguien haga SystemConfig().save() pensando que crea una fila nueva,
    terminará sobrescribiendo la única que existe.

    Si mañana aparece otro ajuste global (el teléfono de soporte, el logo), se
    agrega una columna aquí y no hace falta inventar otra tabla.
    """

    # Valor con el que arranca la tabla. Es el que estaba escrito a mano en el
    # pie del login antes de que esto existiera.
    CORREO_SOPORTE_POR_DEFECTO = 'yleon@sena.edu.co'

    ID_UNICO = 1

    support_email = models.EmailField(default=CORREO_SOPORTE_POR_DEFECTO)

    # Quién lo cambió y cuándo. El correo de soporte sale en el login, que es
    # público, así que conviene poder rastrear quién lo movió. SET_NULL para que
    # el dato sobreviva si algún día se borra ese usuario.
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        Users,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='+',
    )

    class Meta:
        db_table = 'system_config'
        # Sin verbose_name y sin permisos propios: quién puede cambiar esto se
        # decide con is_superuser, no con un permiso asignable. Declarar
        # verbose_name haría aparecer el modelo en la pantalla de permisos.
        default_permissions = ()

    def save(self, *args, **kwargs):
        self.pk = self.ID_UNICO
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """La fila de configuración no se borra: el sistema la necesita."""
        pass

    @classmethod
    def obtener(cls):
        """
        Devuelve la configuración, creándola con los valores por defecto la
        primera vez. Así no hace falta una migración de datos ni acordarse de
        insertar la fila a mano en cada entorno.
        """
        config, _ = cls.objects.get_or_create(pk=cls.ID_UNICO)
        return config

    def __str__(self):
        return f"Configuración del sistema (soporte: {self.support_email})"
