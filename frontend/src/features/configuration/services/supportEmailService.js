// Correo de soporte del sistema. Vive en una tabla de una sola fila en el
// backend (ver modules/configuration/models.py), no en el .env, para que el
// superadministrador pueda cambiarlo desde la interfaz.
import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/config/support-email/";

/**
 * Lee el correo de soporte.
 *
 * NO manda token a propósito: esto se usa también en el login, donde todavía
 * no hay sesión. El endpoint es público del lado del backend.
 */
export async function getSupportEmail() {
    const response = await peticion(API_URL);
    if (!response.ok) {
        throw new Error(await mensajeDeError(response, "No se pudo cargar el correo de soporte"));
    }
    const data = await response.json();
    return data.support_email;
}

/** Cambia el correo de soporte. Solo el superadministrador puede. */
export async function updateSupportEmail(email) {
    const response = await peticion(API_URL, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ support_email: email }),
    });
    if (!response.ok) {
        throw new Error(await mensajeDeError(response, "No se pudo cambiar el correo de soporte"));
    }
    const data = await response.json();
    return data.support_email;
}
