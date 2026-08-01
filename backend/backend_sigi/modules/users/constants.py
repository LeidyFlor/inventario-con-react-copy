"""
Reglas de vencimiento de usuarios.

Algunos usuarios son de planta y no tienen una fecha de fin real. Como
user_date_end no admite nulos (y volverlo nullable obligaría a revisar todos
los sitios que lo leen), se guarda una fecha centinela muy lejana y las
pantallas la traducen a la palabra "Indefinido".

La fecha real solo se ve consultando la base de datos directamente.
"""
from datetime import datetime
from django.utils import timezone


# Grupos cuyos integrantes no tienen fecha de fin.
#
# Por decisión del cliente quedó vacío: el ÚNICO usuario sin vencimiento es el
# superadministrador, que no se identifica por grupo sino por is_superuser.
# Antes estaban aquí 'Administrador' e 'Instructor de Planta'.
#
# La tupla se conserva (en vez de borrar la lógica) porque el requisito ya
# cambió una vez: si mañana vuelven a pedir grupos exentos, basta con
# agregarlos aquí y en el archivo gemelo del frontend.
GRUPOS_SIN_VENCIMIENTO = ()

# Cualquier fecha de fin a partir de este año se considera "sin vencimiento".
# Se usa un umbral y no una igualdad exacta para que la comparación no dependa
# de la hora ni de la zona horaria con que se haya guardado el registro.
ANIO_UMBRAL_INDEFINIDO = 2100


def fecha_fin_indefinida():
    """Fecha centinela que se guarda en la base de datos: 1 de enero de 2200."""
    return timezone.make_aware(datetime(2200, 1, 1))


def es_fecha_fin_indefinida(fecha):
    """True si la fecha guardada corresponde a un usuario sin vencimiento."""
    return bool(fecha) and fecha.year >= ANIO_UMBRAL_INDEFINIDO


def vencimiento_pasado(user_date_end):
    """
    True si la fecha de fin ya quedó atrás.

    La fecha fin es INCLUSIVA: el día que aparece como fecha de finalización
    todavía se puede trabajar, y el bloqueo empieza al día siguiente.

    Por eso se compara por día y no por instante. user_date_end es un
    DateTimeField, pero el formulario solo manda la fecha, así que se guarda
    con hora 00:00. Comparar con timezone.now() hacía que un usuario con fecha
    fin de HOY apareciera vencido desde las 00:01 del mismo día.
    """
    if not user_date_end or es_fecha_fin_indefinida(user_date_end):
        return False
    return timezone.localdate() > timezone.localtime(user_date_end).date()


def esta_dentro_de_vigencia(user_date_start, user_date_end):
    """
    True si el día de hoy cae dentro del rango [inicio, fin], ambos inclusive.

    Se usa al guardar un usuario para decidir si le corresponde estar activo.
    """
    if user_date_start:
        inicio = timezone.localtime(user_date_start).date()
        if timezone.localdate() < inicio:
            return False
    return not vencimiento_pasado(user_date_end)


def tiene_vencimiento_indefinido(user=None, is_superuser=False, group_names=()):
    """
    Decide si a un usuario le corresponde fecha de fin indefinida.

    Se puede llamar con un usuario ya guardado, o con los datos sueltos cuando
    todavía no existe en la base de datos (por ejemplo al crearlo).
    """
    if user is not None:
        is_superuser = user.is_superuser
        group_names = [g.name for g in user.groups.all()]

    if is_superuser:
        return True
    return any(nombre in GRUPOS_SIN_VENCIMIENTO for nombre in group_names)
