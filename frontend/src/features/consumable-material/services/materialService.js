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

    // Varios cuentadantes: se envía una entrada por cada uno bajo la misma
    // clave, que es como DRF espera un ManyToMany en multipart
    ;(formData.inventoryManagers ?? []).forEach(managerId => {
        data.append("inventory_managers", Number(managerId))
    })
    data.append("material_name", formData.materialName)
    data.append("material_description", formData.materialDescription)
    data.append("material_quantity", formData.materialQuantity)
    data.append("material_unit_price", formData.materialUnitPrice)
    data.append("material_location", formData.materialLocation)

    // Marca y modelo son opcionales. La marca se manda aunque venga vacía:
    // como el envío es multipart, DRF convierte "" en null en los campos con
    // allow_null, así que el material queda sin marca en vez de fallar.
    data.append("brand", formData.brandName ?? "")
    // Inventario y categoría son obligatorios (validados por Zod y por el serializer)
    data.append("inventory_name", formData.inventoryName)
    data.append("category", formData.category)
    data.append("material_model", formData.materialModel ?? "")
    data.append("material_serial", formData.materialSerial ?? "")
    // Fechas de adquisición — obligatorias. Son campos date: solo "YYYY-MM-DD"
    data.append("material_purchase_date", formData.materialPurchaseDate)
    data.append("material_entry_date", formData.materialEntryDate)

    // Placa SENA es opcional
    if (formData.materialBarcodeSena) {
        data.append("material_barcode_sena", formData.materialBarcodeSena)
    }
    if (formData.materialImage && formData.materialImage.length > 0) {
        data.append("material_image", formData.materialImage[0])
    }

    // Fichas técnicas — obligatorias. Van como múltiples archivos bajo la misma
    // clave; el backend usa request.FILES.getlist('technical_files')
    if (formData.materialTechnicalSheet && formData.materialTechnicalSheet.length > 0) {
        formData.materialTechnicalSheet.forEach(file => {
            data.append("technical_files", file)
        })
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

    // Varios cuentadantes: se envía una entrada por cada uno bajo la misma
    // clave, que es como DRF espera un ManyToMany en multipart
    ;(formData.inventoryManagers ?? []).forEach(managerId => {
        data.append("inventory_managers", Number(managerId))
    })
    data.append("material_name", formData.materialName)
    data.append("material_description", formData.materialDescription)
    data.append("material_quantity", formData.materialQuantity)
    data.append("material_unit_price", formData.materialUnitPrice)
    data.append("is_active", isActive)

    // Igual que al crear. Enviarla aunque venga vacía permite además QUITARLE
    // la marca a un material que ya la tenía
    data.append("brand", formData.brand ?? "")
    // Inventario y categoría son obligatorios (validados por Zod y por el serializer)
    data.append("inventory_name", formData.inventoryName)
    data.append("category", formData.category)
    data.append("material_model", formData.materialModel ?? "")
    data.append("material_serial", formData.materialSerial ?? "")
    // Fechas de adquisición — obligatorias. Son campos date: solo "YYYY-MM-DD"
    data.append("material_purchase_date", formData.materialPurchaseDate)
    data.append("material_entry_date", formData.materialEntryDate)

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

// Sube fichas técnicas adicionales a un material ya creado
export async function uploadTechnicalFiles(id, files) {
    const token = sessionStorage.getItem("token")
    const data = new FormData()
    files.forEach(file => data.append("technical_files", file))

    const response = await fetch(`${API_URL}/consumable-materials/${id}/upload-technical-files/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: data,
    })
    if (!response.ok) throw new Error("Error al subir fichas técnicas")
    return response.json()
}

// Elimina una ficha técnica específica por su ID
export async function deleteTechnicalFile(materialId, fileId) {
    const token = sessionStorage.getItem("token")
    const response = await fetch(
        `${API_URL}/consumable-materials/${materialId}/delete-technical-file/${fileId}/`,
        {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        }
    )
    if (!response.ok) {
        // El backend explica el motivo cuando se intenta borrar la única ficha
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error ?? "Error al eliminar la ficha técnica")
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