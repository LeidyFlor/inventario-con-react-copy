// src/features/returnable-material/services/selectService.js
// Mismo patrón que consumable-material — marca e inventoryManager vienen del backend,
// tipos de material y estados son constantes que no necesitan request.

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

/**
 * Garantiza que el valor que ya tiene el material siga apareciendo en el select.
 *
 * Los selects solo traen opciones activas. Si a un material se le desactiva
 * después el inventario o la categoría, su valor no estaría en la lista: el
 * select se vería vacío y al guardar le cambiaría el dato sin avisar.
 *
 * Por eso, cuando el valor actual no está entre las opciones, se agrega al
 * final marcado como inactivo. El usuario lo ve, decide si lo cambia, y nada
 * se modifica solo.
 *
 * @param {Array}  options  Opciones activas: [{ value, label }]
 * @param {string} valor    Id que tiene el material, como texto
 * @param {string} etiqueta Nombre legible del valor (viene del *_display)
 */
export function conOpcionActual(options, valor, etiqueta) {
    const normalizadas = options.map(o => ({ value: String(o.value), label: o.label }))
    if (!valor) return normalizadas
    if (normalizadas.some(o => o.value === String(valor))) return normalizadas
    return [...normalizadas, { value: String(valor), label: `${etiqueta || "Sin nombre"} (inactivo)` }]
}

// Nombres de inventario activos para el select del formulario.
// Los desactivados se ocultan igual que las marcas: siguen existiendo en los
// materiales que ya los tenían, pero no se pueden elegir en uno nuevo.
export async function getInventoryNames() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/inventory-names/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    const inventoryNames = await response.json()
    return inventoryNames
        .filter(i => i.is_active)
        .map(i => ({ value: i.id, label: i.name }))
}

// Categorías activas para el select del formulario.
// OJO: es la categoría administrable desde Configuración, no la lista fija
// de getMaterialTypes(), que es el tipo de material.
export async function getCategories() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/categories/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    const categories = await response.json()
    return categories
        .filter(c => c.is_active)
        .map(c => ({ value: c.id, label: c.name }))
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

// Tipo de materials del material devolutivo — constantes del modelo, no necesitan backend
export function getMaterialTypes() {
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
