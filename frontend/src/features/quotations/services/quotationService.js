// Las cotizaciones no siguen el patrón de marca/inventario/categoría: no se
// escriben campos de texto, se suben archivos PDF, y el borrado es real.
import { peticion, mensajeDeError } from "@/shared/services/peticion";

const API_URL = "/api/quotations";

const authHeader = () => ({
    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
});

// Tope de archivos por tanda. Debe coincidir con MAX_ARCHIVOS_POR_TANDA en
// backend/backend_sigi/modules/quotation/views.py — el backend también lo
// valida, esto es solo para avisar antes de enviar.
export const MAX_ARCHIVOS_POR_TANDA = 6;

export async function getQuotations() {
    const res = await peticion(`${API_URL}/`, { headers: authHeader() });
    if (!res.ok) throw new Error("Error al cargar las cotizaciones");
    return res.json();
}

// Sube varios PDF de una vez. Cada archivo queda como una cotización
// independiente, aunque se suban juntos.
export async function uploadQuotations(files) {
    const data = new FormData();
    // Todos bajo la misma clave: el backend usa request.FILES.getlist('files')
    files.forEach(file => data.append("files", file));

    const res = await peticion(`${API_URL}/`, {
        method: "POST",
        headers: authHeader(),
        body: data,
    });
    if (!res.ok) {
        // mensajeDeError revisa el content-type: con el backend caído la
        // respuesta es HTML y antes reventaba el parseo
        throw new Error(await mensajeDeError(res, "No se pudieron subir las cotizaciones"));
    }
    return res.json();
}

// Quita la cotización de todos los materiales que la tengan.
//
// Es el paso previo para poder eliminarla cuando está en uso. Devuelve
// { unlinked, left_without }: cuántos materiales se desenlazaron y cuántos
// quedaron sin ninguna cotización.
export async function unlinkQuotationMaterials(id) {
    const res = await peticion(`${API_URL}/${id}/unlink-materials/`, {
        method: "POST",
        headers: authHeader(),
    });
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo desenlazar la cotización"));
    }
    return res.json();
}

// Borrado real: elimina el registro y el PDF. El backend lo rechaza si algún
// material la tiene enlazada.
export async function deleteQuotation(id) {
    const res = await peticion(`${API_URL}/${id}/`, {
        method: "DELETE",
        headers: authHeader(),
    });
    if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo eliminar la cotización"));
    }
    return res.json();
}
