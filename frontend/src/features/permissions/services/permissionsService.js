import { peticion } from "@/shared/services/peticion";

const API_URL = "/api"

function authHeaders() {
    const token = sessionStorage.getItem("token")
    return { "Authorization": `Bearer ${token}` }
}

// GET /api/users/me/permissions/ — permisos del usuario logueado
// Devuelve { permissions: ["app_label.codename", ...], is_superuser, is_staff }
export async function getMyPermissions() {
    const res = await peticion(`${API_URL}/users/me/permissions/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al obtener los permisos del usuario")
    return res.json()
}

// GET /api/users/me/ — datos del propio usuario logueado
// No requiere el permiso view_users: cualquiera puede ver su propia información
export async function getMyProfile() {
    const res = await peticion(`${API_URL}/users/me/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al obtener el perfil")
    return res.json()
}

// GET /api/permissions/ — lista todos los permisos disponibles del sistema
export async function getPermissions() {
    const res = await peticion(`${API_URL}/permissions/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al obtener permisos")
    return res.json()
}

// GET /api/groups/{id}/ — detalle de un grupo con sus permisos (IDs)
export async function getGroupDetail(groupId) {
    const res = await peticion(`${API_URL}/groups/${groupId}/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al obtener grupo")
    return res.json()
}

// POST /api/groups/{id}/permissions/ — asigna permisos a un grupo
export async function assignGroupPermissions(groupId, permissionIds) {
    const res = await peticion(`${API_URL}/groups/${groupId}/permissions/`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionIds }),
    })
    if (!res.ok) throw new Error("Error al guardar permisos del grupo")
    return res.json()
}

// GET /api/users/{id}/permissions/ — permisos individuales del usuario (IDs)
export async function getUserPermissions(userId) {
    const res = await peticion(`${API_URL}/users/${userId}/permissions/`, { headers: authHeaders() })
    if (!res.ok) throw new Error("Error al obtener permisos del usuario")
    return res.json()
}

// POST /api/users/{id}/permissions/ — asigna permisos individuales al usuario
export async function assignUserPermissions(userId, permissionIds) {
    const res = await peticion(`${API_URL}/users/${userId}/permissions/`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionIds }),
    })
    if (!res.ok) throw new Error("Error al guardar permisos del usuario")
    return res.json()
}
