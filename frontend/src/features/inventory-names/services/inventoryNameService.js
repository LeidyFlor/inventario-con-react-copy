// Mismo patrón que brandService: el CRUD de nombres de inventario es idéntico
// al de marcas, solo cambia la ruta.
const API_URL = "/api/inventory-names";

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export async function getInventoryNames() {
    const res = await fetch(`${API_URL}/`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar los nombres de inventario");
    return res.json();
}

export async function createInventoryName(name) {
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

export async function updateInventoryName(id, name) {
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

export async function toggleInventoryNameStatus(id, isActive) {
    const res = await fetch(`${API_URL}/${id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    return res.json();
}
