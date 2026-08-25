// Envía la señal "sigo aquí" al backend. Se llama cada 2 minutos mientras
// el dashboard está abierto (ver useHeartbeat). Si el navegador deja de
// enviar este latido por más de 5 minutos (pestaña cerrada), el backend
// invalida la sesión automáticamente en la siguiente petición autenticada.
export async function sendHeartbeat() {
  const token = sessionStorage.getItem("token");
  if (!token) return;

  // Silencioso a propósito: si falla (por ejemplo, la sesión ya fue
  // invalidada por otra vía) el interceptor global de 401 (credenciales invalidas) se encargande cerrar sesión en el frontend cuando corresponda.
  //
  // Es el único servicio que sigue usando fetch directo, y es intencional:
  // el .catch de abajo se traga cualquier fallo, así que el mensaje amable
  // que produce peticion() no se mostraría en ningún lado. Envolverlo sería
  // ruido sin beneficio.
  await fetch("/api/users/heartbeat/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).catch(() => {});
}
