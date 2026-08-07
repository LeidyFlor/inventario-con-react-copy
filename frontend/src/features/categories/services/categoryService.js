// CRUD de categorías. Mismo patrón que brandService e inventoryNameService.
//
// OJO con el nombre: esta es la categoría NUEVA, la que se administra desde
// Configuración. La lista fija de herramienta / maquinaria / muebles se llama
// ahora TIPO DE MATERIAL y vive en selectService.js de material devolutivo.
const API_URL = "/api/categories";

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export async function getCategories() {
    const res = await fetch(`${API_URL}/`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar las categorías");
    return res.json();
}

export async function createCategory(name) {
    const res = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
    }
    return res.json();
}

export async function updateCategory(id, name) {
    const res = await fetch(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
    }
    return res.json();
}

export async function toggleCategoryStatus(id, isActive) {
    const res = await fetch(`${API_URL}/${id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    return res.json();
}
