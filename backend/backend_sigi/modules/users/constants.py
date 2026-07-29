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
# El superadministrador no está aquí porque no se identifica por grupo sino
# por el campo is_superuser del modelo Users.
GRUPOS_SIN_VENCIMIENTO = ('Administrador', 'Instructor de Planta')

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
