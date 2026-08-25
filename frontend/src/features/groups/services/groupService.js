import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/groups"

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
})

export async function getGroups() {
    const res = await peticion(`${API_URL}/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al cargar grupos")
    return res.json()
}

export async function createGroup(name) {
    const res = await peticion(`${API_URL}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    })
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo completar la operación"));
    }
    return res.json()
}

export async function updateGroup(id, name) {
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    })
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo completar la operación"));
    }
    return res.json()
}

// Saca del grupo a todos sus usuarios.
//
// Es el paso previo para poder desactivarlo: el backend rechaza desactivar un
// grupo con usuarios asignados. Devuelve { unlinked, left_without }: cuántos
// se retiraron y cuántos quedaron sin ningún grupo.
export async function unlinkGroupUsers(id) {
    const res = await peticion(`${API_URL}/${id}/unlink-users/`, {
        method: "POST",
        headers: authHeaders(),
    })
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudieron retirar los usuarios del grupo"));
    }
    return res.json()
}

export async function toggleGroupStatus(id, isActive) {
    if (!isActive) {
        // Desactivar → DELETE (soft delete con guardia en backend)
        const res = await peticion(`${API_URL}/${id}/`, {
            method: "DELETE",
            headers: authHeaders(),
        })
        if (!res.ok) {
            throw new Error(await mensajeDeError(res, "Error al desactivar grupo"));
        }
        return
    }
    // Activar → PUT con is_active: true
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: true }),
    })
    if (!res.ok) throw new Error("Error al activar grupo")
    return res.json()
}
