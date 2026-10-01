/**
 * Formato de fechas para mostrar en pantalla.
 *
 * El problema que resuelve:
 *
 * Los campos DateField del backend llegan como "2026-10-05", sin hora. Al
 * pasarlos por new Date(), el navegador los interpreta como medianoche en UTC
 * —así lo manda el estándar para ese formato—. En Colombia, que va en UTC-5,
 * esa medianoche cae a las 7 de la noche del DÍA ANTERIOR, y toLocaleDateString
 * termina mostrando 04/10/2026.
 *
 * Es el mismo motivo por el que TIME_ZONE no se deja en 'UTC' en el backend, y
 * por el que LogsModal arma la fecha de hoy con getFullYear/Month/Date en vez
 * de usar toISOString.
 *
 * La solución es no construir un Date cuando el texto no trae hora: se parte en
 * sus tres números y se arma la cadena directamente. Sin Date no hay zona
 * horaria que aplicar, así que no hay nada que corra.
 *
 * Para los valores que SÍ traen hora (created_at, uploaded_at y demás campos
 * DateTimeField) se usa new Date() con normalidad: ahí la conversión a hora
 * local es correcta y es justo lo que se quiere.
 */

// "2026-10-05" exacto: cuatro dígitos, guion, dos, guion, dos, y nada más
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Devuelve la fecha como DD/MM/AAAA.
 *
 * @param {string} valor      Fecha del backend, con o sin hora
 * @param {string} porDefecto Qué mostrar si no hay fecha
 */
export function formatearFecha(valor, porDefecto = "—") {
    if (!valor) return porDefecto;

    const texto = String(valor);

    if (SOLO_FECHA.test(texto)) {
        const [anio, mes, dia] = texto.split("-");
        return `${dia}/${mes}/${anio}`;
    }

    // Con hora incluida sí se puede usar Date: la conversión a hora local es
    // la correcta, porque el instante está completamente definido
    const fecha = new Date(texto);
    if (isNaN(fecha.getTime())) return porDefecto;

    return fecha.toLocaleDateString("es-CO", {
        day:   "2-digit",
        month: "2-digit",
        year:  "numeric",
    });
}
