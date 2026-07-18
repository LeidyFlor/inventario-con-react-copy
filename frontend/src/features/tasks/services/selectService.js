const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

function getHeaders() {
    const token = sessionStorage.getItem("token")
    return { "Authorization": `Bearer ${token}` }
}

/** Usuarios disponibles para asignar tarea → { label: 'Nombre Apellido', value: id } */
export async function getUserName() {
    const res = await fetch(`${API_URL}/users/`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Error al obtener usuarios")
    const data = await res.json()
    return data.map(u => ({
        label: `${u.first_name} ${u.last_name}`.trim(),
        value: u.id,
    }))
}

/** Grupos de Django para asignar tarea a grupo → { label: 'Nombre grupo', value: id } */
export async function getUserTypes() {
    const res = await fetch(`${API_URL}/groups/`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Error al obtener grupos")
    const data = await res.json()
    return data.map(g => ({ label: g.name, value: g.id }))
}

/** Estados disponibles para tareas → { label, value } */
export async function getTaskState() {
    const res = await fetch(`${API_URL}/tasks/states/`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Error al obtener estados de tarea")
    return res.json()
}
