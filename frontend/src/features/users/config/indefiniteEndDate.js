/**
 * Reglas de "fecha fin indefinida".
 *
 * Los usuarios de planta no tienen una fecha de fin real. En la base de datos
 * se guarda una fecha centinela muy lejana (1 de enero de 2200) y en pantalla
 * se muestra la palabra "Indefinido".
 *
 * Debe mantenerse en sintonía con backend/backend_sigi/modules/users/constants.py
 */

// Nombres exactos de los grupos sin vencimiento.
// El superadministrador no está aquí: se identifica por is_superuser.
export const GRUPOS_SIN_VENCIMIENTO = ["Administrador", "Instructor de Planta"]

// Valor que se envía al backend en el campo de fecha fin.
// El backend igual lo reemplaza por su propia centinela, pero se manda una
// fecha válida para que el formulario pase las validaciones de Zod.
export const FECHA_FIN_CENTINELA = "2200-01-01"

// Cualquier fecha a partir de este año cuenta como indefinida. Se usa un
// umbral en vez de comparar la fecha exacta para que no dependa de la hora ni
// de la zona horaria con que se haya guardado el registro.
const ANIO_UMBRAL = 2100

// Texto que ve el usuario en lugar de la fecha
export const TEXTO_FECHA_INDEFINIDA = "Indefinido"

/** True si la fecha guardada corresponde a un usuario sin vencimiento. */
export function esFechaFinIndefinida(valor) {
    if (!valor) return false
    const fecha = valor instanceof Date ? valor : new Date(valor)
    if (Number.isNaN(fecha.getTime())) return false
    return fecha.getFullYear() >= ANIO_UMBRAL
}

/**
 * True si los grupos seleccionados (o la marca de superusuario) implican que
 * el usuario no tiene fecha de fin.
 *
 * @param {Array} gruposSeleccionados  ids de grupo elegidos en el formulario
 * @param {Array} opcionesGrupos       catálogo [{ value, label }] para traducir id → nombre
 * @param {boolean} esSuperusuario
 */
export function grupoSinVencimiento(gruposSeleccionados, opcionesGrupos, esSuperusuario = false) {
    if (esSuperusuario) return true
    if (!Array.isArray(gruposSeleccionados) || gruposSeleccionados.length === 0) return false

    return gruposSeleccionados.some((id) => {
        const opcion = opcionesGrupos?.find((o) => String(o.value) === String(id))
        return opcion ? GRUPOS_SIN_VENCIMIENTO.includes(opcion.label) : false
    })
}

/**
 * Formatea la fecha fin para mostrarla: devuelve "Indefinido" cuando
 * corresponde, y si no, la fecha en formato local.
 */
export function formatearFechaFin(valor) {
    if (esFechaFinIndefinida(valor)) return TEXTO_FECHA_INDEFINIDA
    if (!valor) return "—"
    return new Date(valor).toLocaleDateString("es-CO", {
        day: "2-digit", month: "2-digit", year: "numeric",
    })
}
