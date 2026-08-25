// Las notificaciones no tienen tabla propia: el backend las arma al vuelo
// desde tareas y préstamos. Ver backend_sigi/utils/notification_views.py
import { peticion } from "@/shared/services/peticion";

const API_URL = "/api/notifications";

// Clave donde se guarda la fecha de la última vez que se abrió el menú.
//
// Sin tabla no existe un "leído/no leído" por usuario, así que el punto del
// BellDot se decide comparando esa marca con la fecha del elemento más
// reciente. Es por navegador: si entras desde otro equipo el punto vuelve a
// encenderse. Es el precio de no crear una tabla, y se asumió a conciencia.
const CLAVE_ULTIMA_VISTA = "sigi_notificaciones_vistas";

export async function getNotifications() {
    const res = await peticion(`${API_URL}/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Error al cargar las notificaciones");
    return res.json(); // { items, ultima_fecha }
}

/** Fecha de la última apertura del menú, o null si nunca se abrió. */
export function getUltimaVista() {
    return localStorage.getItem(CLAVE_ULTIMA_VISTA);
}

/** Marca todo como visto. Se llama al abrir el menú. */
export function marcarComoVisto() {
    localStorage.setItem(CLAVE_ULTIMA_VISTA, new Date().toISOString());
}

/**
 * Decide si hay algo sin ver.
 *
 * Si nunca se abrió el menú, cualquier elemento cuenta como nuevo.
 */
export function hayNovedades(ultimaFecha) {
    if (!ultimaFecha) return false;
    const vista = getUltimaVista();
    if (!vista) return true;
    return new Date(ultimaFecha) > new Date(vista);
}
