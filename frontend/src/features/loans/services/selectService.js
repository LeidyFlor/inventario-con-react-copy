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

// Trae los usuarios que pueden figurar como prestador.
//
// Antes se reutilizaba /api/inventory-managers/, que devuelve solo
// cuentadantes. Prestar dejó de depender de esa bandera: ahora es cualquiera
// con permiso de crear préstamos, y ese filtro lo hace el backend.
export async function getLenders() {
    const response = await fetch(`${API_URL}/loans/lenders/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!response.ok) throw new Error("Error al obtener prestadores")
    const data = await response.json()
    return data.map((u) => ({
        label: `${u.first_name} ${u.last_name}`.trim() || u.email,
        value: String(u.id),
    }))
}
