/**
 * Filtro de opciones compartido por Select y MultiSelect.
 *
 * Vive aparte para que los dos componentes busquen exactamente igual: si
 * mañana se cambia el criterio (por ejemplo, buscar también por el value),
 * se cambia en un solo sitio.
 */

// Tope de opciones que se pintan a la vez.
//
// No es un límite de búsqueda: sirve para no crear miles de nodos en el DOM
// cuando la lista crece. Cuando se recorta, la interfaz avisa cuántas hay en
// total, para que nadie crea que las demás no existen.
//
// Si algún día las listas llegan a ser realmente grandes, la solución de
// fondo es buscar en el backend con ?q=, no bajar este número.
export const MAX_OPCIONES_VISIBLES = 50;

/**
 * Quita tildes y pasa a minúsculas.
 *
 * Sin esto, buscar "mario" no encontraría a "Mario Muñóz", que es justo lo que
 * la gente escribe al teclear rápido.
 */
export function normalizar(texto) {
    return String(texto ?? "")
        .toLowerCase()
        .normalize("NFD")
        // Rango de los signos diacríticos que separa NFD
        .replace(/[̀-ͯ]/g, "");
}

/**
 * Filtra por texto y recorta al tope visible.
 *
 * @param {Array}  options  [{ value, label }]
 * @param {string} busqueda Lo que escribió la persona
 * @returns {{ visibles: Array, total: number, recortado: boolean }}
 *          visibles  las que se pintan
 *          total     cuántas coinciden en realidad
 *          recortado si se dejaron de mostrar algunas
 */
export function filtrarOpciones(options = [], busqueda = "") {
    const termino = normalizar(busqueda).trim();

    const coincidencias = termino
        ? options.filter(opt => normalizar(opt.label).includes(termino))
        : options;

    return {
        visibles: coincidencias.slice(0, MAX_OPCIONES_VISIBLES),
        total: coincidencias.length,
        recortado: coincidencias.length > MAX_OPCIONES_VISIBLES,
    };
}
