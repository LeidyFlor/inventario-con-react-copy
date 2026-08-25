import { peticion, mensajeDeError } from "@/shared/services/peticion"

// peticion() en vez de fetch, y mensajeDeError en vez de response.json():
// si el backend está caído la respuesta es HTML y el parseo directo mostraba
// el "Unexpected token '<', "<!DOCTYPE "..." en pantalla.
const API_URL = "/api"

// Paso 1 — Envía el correo y genera el código en Redis
export async function forgotPassword(email) {
    const response = await peticion(`${API_URL}/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    })
    if (!response.ok) {
        throw new Error(await mensajeDeError(response, "Error al enviar el código"))
    }
    return response.json()
}

// Paso 2 — Verifica que el código ingresado sea válido
export async function verifyResetCode(email, code) {
    const response = await peticion(`${API_URL}/auth/verify-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
    })
    if (!response.ok) {
        throw new Error(await mensajeDeError(response, "Código inválido"))
    }
    return response.json()
}

// Paso 3 — Cambia la contraseña con el código verificado
export async function resetPassword(email, code, password) {
    const response = await peticion(`${API_URL}/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
    })
    if (!response.ok) {
        throw new Error(await mensajeDeError(response, "Error al cambiar la contraseña"))
    }
    return response.json()
}