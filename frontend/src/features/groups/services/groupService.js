const API_URL = "/api/groups"

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
})

export async function getGroups() {
    const res = await fetch(`${API_URL}/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al cargar grupos")
    return res.json()
}

export async function createGroup(name) {
    const res = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err))
    }
    return res.json()
}

export async function updateGroup(id, name) {
    const res = await fetch(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(JSON.stringify(err))
    }
    return res.json()
}

export async function toggleGroupStatus(id, isActive) {
    if (!isActive) {
        // Desactivar → DELETE (soft delete con guardia en backend)
        const res = await fetch(`${API_URL}/${id}/`, {
            method: "DELETE",
            headers: authHeaders(),
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error ?? "Error al desactivar grupo")
        }
        return
    }
    // Activar → PUT con is_active: true
    const res = await fetch(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: true }),
    })
    if (!res.ok) throw new Error("Error al activar grupo")
    return res.json()
}
