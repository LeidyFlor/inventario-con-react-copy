/**
 * Envoltorio de fetch con mensajes de error entendibles.
 *
 * El problema que resuelve: los servicios hacían `await response.json()` sobre
 * cualquier respuesta fallida. Cuando el backend está caído, el proxy de Vite
 * devuelve una página HTML de error, y el parseo revienta con
 *
 *     Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 *
 * que es lo que terminaba viendo la persona en pantalla. Y si de plano no hay
 * red, fetch ni siquiera responde: rechaza con "Failed to fetch". Ninguno de
 * los dos mensajes le dice nada a quien está usando el sistema.
 *
 * Aquí se distinguen los dos casos y se traducen a algo accionable.
 */

export const ERROR_SIN_CONEXION =
    "No hay conexión a internet. Revisa tu red e intenta de nuevo.";

export const ERROR_SERVIDOR_CAIDO =
    "No se pudo contactar el servidor. Intenta de nuevo en un momento.";

export const ERROR_RESPUESTA_INVALIDA =
    "El servidor respondió de forma inesperada. Intenta de nuevo en un momento.";

/**
 * Mensaje según si el navegador cree tener red.
 *
 * OJO con navigator.onLine: solo indica si hay una interfaz de red activa, NO
 * si hay internet de verdad. Con el wifi conectado pero sin salida a internet
 * sigue devolviendo true. Por eso se usa apenas como pista para elegir el
 * mensaje, nunca como una comprobación real.
 */
function mensajeDeRed() {
    return navigator.onLine === false ? ERROR_SIN_CONEXION : ERROR_SERVIDOR_CAIDO;
}

/**
 * Como fetch, pero convierte el fallo de red en un Error con mensaje legible.
 *
 * Se marca con esRedError para que quien lo reciba pueda distinguirlo de un
 * error de negocio devuelto por el backend.
 */
export async function peticion(url, options) {
    try {
        return await fetch(url, options);
    } catch {
        // fetch solo rechaza cuando la petición no llegó a completarse: sin
        // red, DNS que no resuelve, servidor que no acepta la conexión.
        // Un 400 o un 500 NO pasan por aquí, esos sí devuelven respuesta.
        const err = new Error(mensajeDeRed());
        err.esRedError = true;
        throw err;
    }
}

/**
 * Lee el cuerpo como JSON solo si de verdad lo es.
 *
 * Devuelve null cuando la respuesta no es JSON, en vez de lanzar el error de
 * parseo. Así el llamador decide qué mensaje mostrar.
 */
export async function leerJson(response) {
    const tipo = response.headers.get("content-type") ?? "";
    if (!tipo.includes("application/json")) return null;
    try {
        return await response.json();
    } catch {
        // Content-type dice JSON pero el cuerpo llegó incompleto o vacío
        return null;
    }
}

/**
 * Extrae el mensaje de error de una respuesta fallida.
 *
 * Si el backend mandó JSON, se usa su mensaje —que es el que de verdad
 * explica qué pasó—. Si mandó HTML (típico cuando está caído), se cae al
 * mensaje genérico en vez de mostrar el "<!DOCTYPE".
 *
 * @param {Response} response
 * @param {string}   porDefecto  Mensaje propio del caso, ej: "Error al iniciar sesión"
 */
export async function mensajeDeError(response, porDefecto) {
    const datos = await leerJson(response);
    if (!datos) return ERROR_RESPUESTA_INVALIDA;

    // Los serializers de DRF responden de varias formas según dónde falló:
    //   { error: "..." }              → errores propios del proyecto
    //   { detail: "..." }             → errores estándar de DRF
    //   { campo: ["mensaje", ...] }   → errores de validación por campo
    if (typeof datos.error === "string") return datos.error;
    if (typeof datos.detail === "string") return datos.detail;

    const primero = Object.values(datos)[0];
    if (Array.isArray(primero) && typeof primero[0] === "string") return primero[0];
    if (typeof primero === "string") return primero;

    return porDefecto;
}
