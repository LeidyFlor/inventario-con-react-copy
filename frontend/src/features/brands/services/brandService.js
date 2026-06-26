const API_URL = "/api/brands";

const authHeaders = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
    "Content-Type": "application/json",
});

export async function getBrands() {
    const res = await fetch(`${API_URL}/`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar marcas");
    return res.json();
}

export async function createBrand(name) {
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

export async function updateBrand(id, name) {
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

export async function toggleBrandStatus(id, isActive) {
    const res = await fetch(`${API_URL}/${id}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    return res.json();
}
