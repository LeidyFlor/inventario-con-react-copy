const API_URL = "/api"

function getToken() {
    return sessionStorage.getItem("token")
}

// Trae todos los usuarios activos para el select de "usuario solicitante"
export async function getUserName() {
    const response = await fetch(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) throw new Error("Error al obtener usuarios")
    const data = await response.json()
    return data
        .filter((u) => u.is_active)
        .map((u) => ({
            label: `${u.first_name} ${u.last_name}`.trim() || u.email,
            value: String(u.id),
        }))
}

// Tipos de préstamo — valores fijos, no necesitan endpoint
export async function getLoanTypes() {
    return [
        { label: "Interno", value: "interno" },
        { label: "Externo", value: "externo" },
    ]
}

// Trae solo los cuentadantes (is_accountant=true) para el campo "usuario prestador"
// Reutiliza el endpoint que ya existe en el módulo de materiales
export async function getLenders() {
    const response = await fetch(`${API_URL}/inventory-managers/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) throw new Error("Error al obtener prestadores")
    const data = await response.json()
    return data.map((u) => ({
        label: `${u.first_name} ${u.last_name}`.trim() || u.email,
        value: String(u.id),
    }))
}
