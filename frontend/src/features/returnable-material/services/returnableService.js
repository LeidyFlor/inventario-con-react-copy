// src/features/returnable-material/services/returnableService.js

const API_URL = "/api"

// Trae todos los materiales devolutivos con sus fichas técnicas incluidas
export async function getReturnables() {
    const token = sessionStorage.getItem("token")
    const response = await fetch(`${API_URL}/returnable-materials/`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Error al obtener materiales devolutivos")
    return response.json()
}

// Crea un material devolutivo.
// Usa FormData porque puede traer imagen + varias fichas técnicas.
export async function createReturnable(formData) {
    const token = sessionStorage.getItem("token")
    const data = new FormData()

    // Marca opcional: al ser multipart, DRF convierte "" en null
    data.append("brand",                formData.brandName ?? "")
    // Varios cuentadantes: se envía una entrada por cada uno bajo la misma
    // clave, que es como DRF espera un ManyToMany en multipart
    ;(formData.inventoryManagers ?? []).forEach(managerId => {
        data.append("inventory_managers", Number(managerId))
    })
    data.append("material_name",        formData.materialName)
    data.append("material_description", formData.materialDescription)
    data.append("material_barcode_sena",formData.materialBarcodeSena || "")
    data.append("material_unit_price",  formData.materialUnitPrice)
    data.append("material_location",    formData.materialLocation || "")
    data.append("material_model",       formData.returnableMaterialModel || "")
    data.append("material_serial",      formData.returnableMaterialSerial || "")
    // Fechas de adquisición — obligatorias. Son campos date: solo "YYYY-MM-DD"
    data.append("material_purchase_date", formData.materialPurchaseDate)
    data.append("material_entry_date",    formData.materialEntryDate)
    // Cantidad: solo relevante para herramienta sin placa; el backend la fuerza a 1 en los demás casos
    if (formData.materialQuantity) {
        data.append("material_quantity", formData.materialQuantity)
    }
    data.append("material_category",    formData.returnableMaterialCategory)

    // Dimensiones solo si la categoría es muebles_enseres
    if (formData.returnableMaterialDimensions) {
        data.append("material_dimensions", formData.returnableMaterialDimensions)
    }

    // Imagen principal (máx 1)
    if (formData.materialImage && formData.materialImage.length > 0) {
        data.append("material_image", formData.materialImage[0])
    }

    // Fichas técnicas (múltiples archivos bajo la misma clave)
    // El backend usa request.FILES.getlist('technical_files')
    if (formData.materialTechnicalSheet && formData.materialTechnicalSheet.length > 0) {
        formData.materialTechnicalSheet.forEach(file => {
            data.append("technical_files", file)
        })
    }

    const response = await fetch(`${API_URL}/returnable-materials/`, {
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

// Activa o desactiva un material devolutivo
export async function toggleReturnableStatus(id, isActive, materialState = null) {
    const token = sessionStorage.getItem("token")
    const body = { is_active: isActive }
    if (!isActive && materialState) body.material_state = materialState

    const response = await fetch(`${API_URL}/returnable-materials/${id}/`, {
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

// Sube fichas técnicas adicionales a un material ya creado
export async function uploadTechnicalFiles(id, files) {
    const token = sessionStorage.getItem("token")
    const data = new FormData()
    files.forEach(file => data.append("technical_files", file))

    const response = await fetch(`${API_URL}/returnable-materials/${id}/upload-technical-files/`, {
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
        `${API_URL}/returnable-materials/${materialId}/delete-technical-file/${fileId}/`,
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
