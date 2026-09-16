"""
Reglas de fuerza de la contraseña.

Deben coincidir con el esquema Zod del frontend
(frontend/src/features/auth/schemas/restorePasswordSchema.js).

El frontend valida para dar mensajes inmediatos, pero la validación que de
verdad cuenta es esta: sin ella, cualquiera podría saltarse la interfaz y
mandar una contraseña débil con una petición directa a la API.

Las reglas de fuerza (mayúscula, minúscula, número y símbolo) se escriben aquí
porque no vienen de fábrica en Django. La de parecido con los datos del usuario
sí viene: es UserAttributeSimilarityValidator, y se reutiliza tal cual.

OJO con un detalle de Django: set_password() NO ejecuta los
AUTH_PASSWORD_VALIDATORS por su cuenta, hay que llamarlos a mano. Por eso la
lista de settings.py no basta y este módulo tiene que invocar el validador
explícitamente.
"""
import re

from django.contrib.auth.password_validation import UserAttributeSimilarityValidator
from django.core.exceptions import ValidationError

LONGITUD_MINIMA = 8

# (expresión, mensaje) — el orden define cuál error se reporta primero
REGLAS = [
    (re.compile(r'[A-Z]'),      'Debe contener al menos una mayúscula'),
    (re.compile(r'[a-z]'),      'Debe contener al menos una minúscula'),
    (re.compile(r'[0-9]'),      'Debe contener al menos un número'),
    (re.compile(r'[^A-Za-z0-9]'), 'Debe contener al menos un carácter especial'),
]


# Campos del usuario contra los que se compara la contraseña, con su nombre en
# español para el mensaje. El orden decide cuál se reporta si coincide en varios.
CAMPOS_COMPARADOS = (
    ('email',      'tu correo electrónico'),
    ('username',   'tu nombre de usuario'),
    ('first_name', 'tu nombre'),
    ('last_name',  'tu apellido'),
)


def error_de_similitud(password, user):
    """
    Rechaza contraseñas demasiado parecidas a los datos del propio usuario.

    Por ejemplo, "ana@example" para la cuenta ana@example.com: es casi el correo
    completo, así que a quien lo conozca le basta un intento.

    Lo hace UserAttributeSimilarityValidator de Django, que además de comparar
    el valor completo lo parte en trozos: del correo saca "ana", "example" y
    "com" por separado. El umbral es 0.7 por defecto, y se da por parecida una
    contraseña que lo supere.

    Se llama un validador por campo, en vez de uno solo con los cuatro, para
    poder decir en el mensaje a QUÉ se parece. El mensaje propio de Django está
    en inglés, porque LANGUAGE_CODE del proyecto es 'en-us'.
    """
    if user is None:
        return None

    for campo, etiqueta in CAMPOS_COMPARADOS:
        try:
            UserAttributeSimilarityValidator(user_attributes=(campo,)).validate(password, user)
        except ValidationError:
            return f'La contraseña no puede parecerse a {etiqueta}'

    return None


def errores_de_password(password, user=None):
    """
    Devuelve la lista de reglas incumplidas. Vacía si la contraseña sirve.

    El usuario es opcional: sin él se revisa solo la fuerza. Se pasa cuando se
    sabe de quién es la contraseña, para añadir la comprobación de parecido.
    """
    errores = []

    if not password or len(password) < LONGITUD_MINIMA:
        errores.append(f'Contraseña debe tener mínimo {LONGITUD_MINIMA} caracteres')

    for expresion, mensaje in REGLAS:
        if not password or not expresion.search(password):
            errores.append(mensaje)

    parecido = error_de_similitud(password, user)
    if parecido:
        errores.append(parecido)

    return errores
