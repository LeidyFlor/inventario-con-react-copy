const API_URL = "/api"

// Trae todos los materiales consumibles
export async function getMaterials() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/consumable-materials/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Error al obtener materiales")
    return response.json()
}

// Crea un material — usa FormData porque puede traer imagen
export async function createMaterial(formData) {
    const token = sessionStorage.getItem("token")
    const data = new FormData()

    data.append("brand", formData.brandName)
    data.append("inventory_manager", formData.inventoryManager)
    data.append("material_name", formData.materialName)
    data.append("material_description", formData.materialDescription)
    data.append("material_quantity", formData.materialQuantity)
    data.append("material_unit_price", formData.materialUnitPrice)
    data.append("material_location", formData.materialLocation)

    // Placa SENA es opcional
    if (formData.materialBarcodeSena) {
        data.append("material_barcode_sena", formData.materialBarcodeSena)
    }
    if (formData.materialImage && formData.materialImage.length > 0) {
        data.append("material_image", formData.materialImage[0])
    }

    const response = await fetch(`${API_URL}/consumable-materials/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: data,
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return response.json()
}

// Activa o desactiva un material
// Si se desactiva, debe enviarse el motivo (materialState)
export async function toggleMaterialStatus(id, isActive, materialState = null) {
    const token = sessionStorage.getItem("token")
    const body = { is_active: isActive }
    if (!isActive && materialState) body.material_state = materialState

    const response = await fetch(`${API_URL}/consumable-materials/${id}/`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error("Error al actualizar estado del material")
    return response.json()
}