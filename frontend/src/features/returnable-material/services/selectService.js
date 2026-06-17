// src/features/returnable-material/services/selectService.js
// Mismo patrón que consumable-material — marca e inventoryManager vienen del backend,
// categorías y estados son constantes que no necesitan request.

const API_URL = "/api"

// Marcas activas para el select del formulario
export async function getBrands() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/brands/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    const brands = await response.json()
    return brands
        .filter(b => b.is_active)
        .map(b => ({ value: b.id, label: b.name }))
}

// Cuentadantes (usuarios con is_accountant=True) para el select
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

// Categorías del material devolutivo — constantes del modelo, no necesitan backend
export function getMaterialCategories() {
    return [
        { value: "herramienta",          label: "Herramienta" },
        { value: "maquinaria_equipos",   label: "Maquinaria y equipos" },
        { value: "muebles_enseres",      label: "Muebles y enseres" },
    ]
}

// Motivos de inactividad — también constantes
export function getMaterialStates() {
    return [
        { value: "no_disponible", label: "No disponible" },
        { value: "prestado",      label: "Prestado" },
        { value: "traslado",      label: "Traslado" },
        { value: "baja",          label: "Baja" },
    ]
}
