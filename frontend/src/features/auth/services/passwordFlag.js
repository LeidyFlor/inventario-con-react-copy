/**
 * Marca de "debe cambiar la contraseña".
 *
 * El backend la devuelve en la respuesta del login (must_change_password) y
 * vale true mientras el usuario siga con la contraseña temporal. Se guarda en
 * sessionStorage junto al token para que sobreviva a un F5 sin volver a pedirla.
 *
 * Mientras esté activa, RequirePasswordChange no deja navegar a ninguna otra
 * pantalla del dashboard. Tiene sentido: si el usuario no la cambia dentro de
 * las 2 horas, el backend le desactiva la cuenta en el siguiente intento de
 * inicio de sesión.
 */
const KEY = "mustChangePassword"

export function setMustChangePassword(valor) {
    if (valor) sessionStorage.setItem(KEY, "true")
    else sessionStorage.removeItem(KEY)
}

export function getMustChangePassword() {
    return sessionStorage.getItem(KEY) === "true"
}

export function clearMustChangePassword() {
    sessionStorage.removeItem(KEY)
}
