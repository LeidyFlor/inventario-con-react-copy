// CRUD de categorías. Mismo patrón que brandService e inventoryNameService.
//
// OJO con el nombre: esta es la categoría NUEVA, la que se administra desde
// Configuración. La lista fija de herramienta / maquinaria / muebles se llama
// ahora TIPO DE MATERIAL y vive en selectService.js de material devolutivo.
import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/categories";

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export async function getCategories() {
    const res = await peticion(`${API_URL}/`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar las categorías");
    return res.json();
}

export async function createCategory(name) {
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

export async function updateCategory(id, name) {
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

export async function toggleCategoryStatus(id, isActive) {
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    return res.json();
}
