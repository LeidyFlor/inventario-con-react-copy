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

    data.append("inventory_manager", formData.inventoryManager)
    data.append("material_name", formData.materialName)
    data.append("material_description", formData.materialDescription)
    data.append("material_quantity", formData.materialQuantity)
    data.append("material_unit_price", formData.materialUnitPrice)
    data.append("material_location", formData.materialLocation)

    // Marca y modelo son opcionales. La marca se manda aunque venga vacía:
    // como el envío es multipart, DRF convierte "" en null en los campos con
    // allow_null, así que el material queda sin marca en vez de fallar.
    data.append("brand", formData.brandName ?? "")
    data.append("material_model", formData.materialModel ?? "")

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

// Trae un material por ID
export async function getMaterial(id) {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/consumable-materials/${id}/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Material no encontrado")
    return response.json()
}

// Edita un material — usa FormData porque puede traer imagen
export async function updateMaterial(id, formData, isActive, materialImage) {
    const token = sessionStorage.getItem("token")
    const data = new FormData()

    data.append("inventory_manager", formData.inventoryManager)
    data.append("material_name", formData.materialName)
    data.append("material_description", formData.materialDescription)
    data.append("material_quantity", formData.materialQuantity)
    data.append("material_unit_price", formData.materialUnitPrice)
    data.append("is_active", isActive)

    // Igual que al crear. Enviarla aunque venga vacía permite además QUITARLE
    // la marca a un material que ya la tenía
    data.append("brand", formData.brand ?? "")
    data.append("material_model", formData.materialModel ?? "")

    if (formData.materialBarcodeSena)
        data.append("material_barcode_sena", formData.materialBarcodeSena)
    if (formData.materialLocation)
        data.append("material_location", formData.materialLocation)
    if (!isActive && formData.materialState)
        data.append("material_state", formData.materialState)
    if (materialImage && materialImage.length > 0)
        data.append("material_image", materialImage[0])

    const response = await fetch(`${API_URL}/consumable-materials/${id}/`, {
        method: "PATCH",
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