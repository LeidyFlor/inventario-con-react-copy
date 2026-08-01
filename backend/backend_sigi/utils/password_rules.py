"""
Reglas de fuerza de la contraseña.

Deben coincidir con el esquema Zod del frontend
(frontend/src/features/auth/schemas/restorePasswordSchema.js).

El frontend valida para dar mensajes inmediatos, pero la validación que de
verdad cuenta es esta: sin ella, cualquiera podría saltarse la interfaz y
mandar una contraseña débil con una petición directa a la API.

No se usan los AUTH_PASSWORD_VALIDATORS de Django porque set_password() no
los ejecuta por su cuenta: hay que llamarlos a mano, y estas reglas concretas
(mayúscula, minúscula, número y símbolo) no vienen incluidas de fábrica.
"""
import re

LONGITUD_MINIMA = 8

# (expresión, mensaje) — el orden define cuál error se reporta primero
REGLAS = [
    (re.compile(r'[A-Z]'),      'Debe contener al menos una mayúscula'),
    (re.compile(r'[a-z]'),      'Debe contener al menos una minúscula'),
    (re.compile(r'[0-9]'),      'Debe contener al menos un número'),
    (re.compile(r'[^A-Za-z0-9]'), 'Debe contener al menos un carácter especial'),
]


def errores_de_password(password):
    """Devuelve la lista de reglas incumplidas. Vacía si la contraseña sirve."""
    errores = []

    if not password or len(password) < LONGITUD_MINIMA:
        errores.append(f'Contraseña debe tener mínimo {LONGITUD_MINIMA} caracteres')

    for expresion, mensaje in REGLAS:
        if not password or not expresion.search(password):
            errores.append(mensaje)

    return errores
