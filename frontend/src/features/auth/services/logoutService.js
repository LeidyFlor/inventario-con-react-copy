//Cerrar sesion eliminando jwt
import { clearMustChangePassword } from "./passwordFlag";

const API_URL = "/api/auth";
export async function logout() {
  const token = sessionStorage.getItem("token");

  // Se limpia el navegador PRIMERO, sin esperar al backend. Dos razones:
  //
  // 1. Si la petición tarda (con la base remota puede tardar segundos), el
  //    usuario ya quedó desconectado en su navegador y la interfaz responde
  //    de inmediato en vez de congelarse.
  // 2. Mientras la petición viaja, el heartbeat u otra llamada en curso
  //    podrían seguir usando el token. Al borrarlo ya no lo encuentran.
  sessionStorage.removeItem("token");
  clearMustChangePassword();

  if (!token) return;

  // Avisar al backend para quitar el token de la base de datos.
  // No se espera la respuesta ni se propaga el error: si falla, la sesión
  // del servidor caduca sola por el tope de 8 horas o por el heartbeat.
  fetch("/api/users/logout/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).catch(() => {});
}
