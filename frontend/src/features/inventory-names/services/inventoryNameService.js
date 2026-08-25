// Mismo patrón que brandService: el CRUD de nombres de inventario es idéntico
// al de marcas, solo cambia la ruta.
import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/inventory-names";

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export async function getInventoryNames() {
    const res = await peticion(`${API_URL}/`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar los nombres de inventario");
    return res.json();
}

export async function createInventoryName(name) {
    const res = await peticion(`${API_URL}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo completar la operación"));
    }
    return res.json();
}

export async function updateInventoryName(id, name) {
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo completar la operación"));
    }
    return res.json();
}

export async function toggleInventoryNameStatus(id, isActive) {
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    return res.json();
}
