// frontend/src/features/auth/services/authService.js
// Consumir API login
// 🤣🤣
const API_URL = "/api/auth";

export async function login(userData) {
  const response = await fetch(`${API_URL}/login`, {
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
    const error = await response.json();
    const err = new Error(error.error || "Error login");
    // Se conserva el status HTTP para que LoginForm pueda distinguir
    // "sesión ya activa" (409) de "credenciales inválidas" (401).
    // El mensaje en sí sigue siendo genérico para no revelar si el
    // correo existe o si la contraseña tiene el formato incorrecto.
    err.status = response.status;
    throw err;
  }

  return response.json();
}
