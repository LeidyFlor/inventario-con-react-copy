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
    throw new Error(error.error || "Error login");
  }

  return response.json();
}
