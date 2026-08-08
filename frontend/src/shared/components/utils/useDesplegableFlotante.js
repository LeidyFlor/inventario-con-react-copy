import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Posiciona un menú desplegable fuera del flujo del documento.
 *
 * El problema que resuelve: si el menú se dibuja como `absolute` dentro del
 * campo, cualquier ancestro con overflow-hidden lo recorta. Pasaba con los
 * formularios que van dentro de una caja con bordes redondeados: el menú se
 * cortaba contra el borde del contenedor.
 *
 * La solución es sacarlo a document.body con un portal y ubicarlo con
 * position: fixed usando las coordenadas reales del campo. Como queda fuera
 * del contenedor, ya nada lo puede recortar.
 *
 * Además decide si abrir hacia abajo o hacia arriba: si abajo no cabe y arriba
 * hay más sitio, se voltea. Así un campo al final de la página no deja el menú
 * fuera de la pantalla.
 *
 * @param {boolean} abierto  Si el menú está visible
 * @returns {{ anclaRef, flotanteRef, estilo }}
 *          anclaRef     va en el campo que abre el menú
 *          flotanteRef  va en el menú
 *          estilo       se aplica al menú como prop style
 */
export function useDesplegableFlotante(abierto) {
    const anclaRef = useRef(null);
    const flotanteRef = useRef(null);
    const [estilo, setEstilo] = useState({ position: "fixed", visibility: "hidden" });

    const recalcular = useCallback(() => {
        const ancla = anclaRef.current;
        if (!ancla) return;

        const r = ancla.getBoundingClientRect();
        // En el primer render el menú aún no está medido; 240 es una
        // estimación razonable para decidir el lado
        const alto = flotanteRef.current?.offsetHeight || 240;

        const espacioAbajo  = window.innerHeight - r.bottom;
        const espacioArriba = r.top;
        // Solo se voltea si abajo no cabe Y arriba hay más espacio: si ninguno
        // de los dos alcanza, abajo es lo esperable
        const haciaArriba = espacioAbajo < alto && espacioArriba > espacioAbajo;

        const MARGEN = 4;   // separación con el campo
        const RESPIRO = 16; // no pegar el menú al borde de la ventana

        setEstilo({
            position: "fixed",
            left: r.left,
            width: r.width,
            visibility: "visible",
            ...(haciaArriba
                ? {
                    bottom: window.innerHeight - r.top + MARGEN,
                    maxHeight: Math.max(120, espacioArriba - RESPIRO),
                }
                : {
                    top: r.bottom + MARGEN,
                    maxHeight: Math.max(120, espacioAbajo - RESPIRO),
                }),
        });
    }, []);

    // useLayoutEffect y no useEffect: coloca el menú ANTES de que el navegador
    // pinte, para que no se vea dar un salto desde la esquina
    useLayoutEffect(() => {
        if (abierto) recalcular();
        else setEstilo({ position: "fixed", visibility: "hidden" });
    }, [abierto, recalcular]);

    useEffect(() => {
        if (!abierto) return;
        const alMover = () => recalcular();
        window.addEventListener("resize", alMover);
        // true = fase de captura: así se entera también del scroll de
        // contenedores internos, no solo del de la ventana
        window.addEventListener("scroll", alMover, true);
        return () => {
            window.removeEventListener("resize", alMover);
            window.removeEventListener("scroll", alMover, true);
        };
    }, [abierto, recalcular]);

    return { anclaRef, flotanteRef, estilo };
}

/**
 * Cierra el menú al hacer clic afuera.
 *
 * Recibe los DOS refs a propósito: como el menú vive en un portal, no está
 * dentro del campo en el árbol del DOM. Si solo se mirara el campo, cualquier
 * clic dentro del propio menú lo cerraría al instante.
 */
export function useCerrarAlClicarFuera(refs, alCerrar) {
    useEffect(() => {
        function manejar(e) {
            const dentro = refs.some(ref => ref.current?.contains(e.target));
            if (!dentro) alCerrar();
        }
        document.addEventListener("mousedown", manejar);
        return () => document.removeEventListener("mousedown", manejar);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
