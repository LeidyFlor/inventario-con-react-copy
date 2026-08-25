import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/brands";

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export async function getBrands() {
    const res = await peticion(`${API_URL}/`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar marcas");
    return res.json();
}

export async function createBrand(name) {
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

export async function updateBrand(id, name) {
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

export async function toggleBrandStatus(id, isActive) {
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    return res.json();
}
