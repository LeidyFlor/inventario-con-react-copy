// frontend/src/features/auth/services/authService.js
// Consumir API login
import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/auth";

export async function login(userData) {
  // peticion() en vez de fetch: si no hay red o el backend está caído, lanza
  // un Error con un mensaje entendible en vez de "Failed to fetch"
  const response = await peticion(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // email y password son los valores que espera el backend
    body: JSON.stringify({
      email: userData.userEmail,
      password: userData.userPassword,
    }),
  });

  if (!response.ok) {
    // Antes esto hacía response.json() a secas. Cuando el backend estaba caído
    // el proxy devolvía HTML y el parseo reventaba, mostrando en pantalla el
    // "Unexpected token '<', "<!DOCTYPE "...". mensajeDeError solo parsea si
    // la respuesta de verdad es JSON.
    const err = new Error(await mensajeDeError(response, "Error login"));
    // Se conserva el status HTTP para que LoginForm pueda distinguir
    // "sesión ya activa" (409) y "cuenta desactivada" (403) de
    // "credenciales inválidas" (401).
    // El mensaje en sí sigue siendo genérico para no revelar si el
    // correo existe o si la contraseña tiene el formato incorrecto.
    err.status = response.status;
    throw err;
  }

  return response.json();
}
