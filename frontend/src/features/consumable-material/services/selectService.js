const API_URL = "/api"

// Marcas activas para el select del formulario
export async function getBrands() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/brands/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    const brands = await response.json()
    // Solo marcas activas, formateadas para el componente Select
    return brands
        .filter(b => b.is_active)
        .map(b => ({ value: b.id, label: b.name }))
}

// Cuentadantes para el select del formulario
export async function getInventoryManagers() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/inventory-managers/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    const managers = await response.json()
    return managers.map(m => ({
        value: m.id,
        label: `${m.first_name} ${m.last_name}`
    }))
}

// Estados del material — fijos, no cambian, no necesitan backend
// Solo aplican cuando el material está inactivo (motivo de inactividad)
export function getMaterialStates() {
    return [
        { value: "no_disponible", label: "No disponible" },
        { value: "prestado",      label: "Prestado" },
        { value: "traslado",      label: "Traslado" },
        { value: "baja",          label: "Baja" },
    ]
}