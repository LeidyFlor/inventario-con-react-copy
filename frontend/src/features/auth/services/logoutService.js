//Cerrar sesion eliminando jwt
import { clearMustChangePassword } from "./passwordFlag";

const API_URL = "/api/auth";
export async function logout() {
  const token = sessionStorage.getItem("token");

  //avisar al bakend para quitar el token de la bd. el await hace peticoin http al backend y espera hasta que este responda. authorization es le token enviado al backend para que este sea destruido, y tambien session_expires_at
  await fetch("/api/users/logout/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  //Borra token del frontend
  sessionStorage.removeItem("token");
  // Y la marca de cambio obligatorio, para que no quede pegada si el
  // siguiente usuario que entra en esta pestaña sí tiene su contraseña al día
  clearMustChangePassword();
}
