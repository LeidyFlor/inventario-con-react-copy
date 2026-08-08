import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { filtrarOpciones } from "./utils/filtrarOpciones";
import { useDesplegableFlotante, useCerrarAlClicarFuera } from "./utils/useDesplegableFlotante";

/**
 * Desplegable de selección única, con buscador.
 *
 * Antes era un <select> nativo. Se reconstruyó como desplegable propio porque
 * dentro de un <select> el navegador solo admite <option>: no hay forma de
 * meterle un campo de texto para filtrar.
 *
 * IMPORTANTE — el contrato con los formularios NO cambió. onChange sigue
 * recibiendo un objeto con la forma { target: { name, value } }, igual que el
 * evento del select nativo, así que los 42 sitios que hacen handleChange(e) y
 * leen e.target.value siguen funcionando sin tocarse.
 *
 * Se pierde una cosa respecto al nativo: en celular ya no abre el selector del
 * sistema operativo.
 *
 * El menú se dibuja en un portal sobre document.body, no dentro del campo: de
 * lo contrario los contenedores con overflow-hidden de los formularios lo
 * recortaban. Ver useDesplegableFlotante.
 */
export default function Select({
    label,
    name,
    error,
    value,
    onChange,
    options = [],
    variant = "default",
    required,
    disabled = false,
    placeholder = "Seleccione una opcion",
    ...props
}) {
    const variants = {
        default: "rounded-2xl border-2 border-input-border text-medium  bg-input-fill placeholder-text-muted hover:border-2 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring",
        isEdit: "border-gradient-input-edit border-0 rounded-t-xl text-medium text-text-secundary placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
        nameEdit: "border-b-2 border-border rounded-t-xl text-body font-semibold text-text-secundary text-center placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
    }

    const [open, setOpen] = useState(false)
    const [busqueda, setBusqueda] = useState("")
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    // Coloca el menú fuera del contenedor y decide si abre hacia abajo o arriba
    const { anclaRef, flotanteRef, estilo } = useDesplegableFlotante(open)

    // Se pasan los dos refs: el menú está en un portal, así que un clic dentro
    // de él NO cuenta como clic fuera del campo
    useCerrarAlClicarFuera([containerRef, flotanteRef], () => setOpen(false))

    // Al abrir, el cursor queda en el buscador para poder escribir de una vez
    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    const { visibles, total, recortado } = filtrarOpciones(options, busqueda)

    // La comparación va como texto: los ids llegan como número desde el
    // backend y como texto desde el formulario
    const seleccionada = options.find(opt => String(opt.value) === String(value))

    const cerrar = () => {
        setOpen(false)
        setBusqueda("")
    }

    /**
     * Notifica igual que lo hacía el <select> nativo.
     *
     * Se fabrica el objeto con forma de evento para no tener que cambiar
     * ningún formulario: todos esperan e.target.name y e.target.value.
     */
    const elegir = (nuevoValor) => {
        onChange?.({ target: { name, value: nuevoValor } })
        cerrar()
    }

    const alTeclear = (e) => {
        if (e.key === "Escape") {
            cerrar()
        } else if (e.key === "Enter") {
            // Enter elige la primera coincidencia, que es lo que se espera
            // después de escribir para filtrar
            e.preventDefault()
            if (visibles.length > 0) elegir(String(visibles[0].value))
        }
    }

    return (
        <div className="w-full relative min-w-0" ref={containerRef}>
            {label && (
                <label className={
                    `block
                    text-caption
                    mb-1
                    place-self-start
                    ${error ? "text-error" : "text-text-primary" }
                    `}
                >
                    {label}
                    {required && <span className="text-error ml-0.5 text-small">*</span>}
                </label>
            )}

            {/* Campo que abre el desplegable. Es un button y no un div para
                que se pueda alcanzar con el tabulador y activar con Enter. */}
            <button
                ref={anclaRef}
                type="button"
                name={name}
                disabled={disabled}
                onClick={() => !disabled && setOpen(prev => !prev)}
                {...props}
                className={`
                    w-full
                    h-10
                    px-4
                    flex items-center justify-between gap-2
                    overflow-hidden
                    text-left
                    transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${variants[variant]}
                    ${error ? "border-2 border-red-800" : "border border-border"}
                    ${!seleccionada ? "text-text-muted" : "text-text-primary"}
                    `}
            >
                {/* flex-1 min-w-0 truncate: corta con "..." en vez de estirar
                    el campo cuando la etiqueta es larga */}
                <span className="flex-1 min-w-0 truncate">
                    {seleccionada ? seleccionada.label : placeholder}
                </span>
                <span className="text-xs shrink-0">
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </button>

            {open && createPortal(
                <div
                    ref={flotanteRef}
                    style={estilo}
                    // z-[60] para quedar por encima de los modales, que usan z-50
                    className="z-[60] bg-input-fill border-2 border-input-border rounded-2xl shadow-lg overflow-hidden flex flex-col"
                >
                    {/* Buscador */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-input-border">
                        <Search size={16} className="text-text-muted shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={alTeclear}
                            placeholder="Buscar..."
                            className="w-full bg-transparent text-medium text-text-primary placeholder-text-muted focus:outline-none"
                        />
                    </div>

                    <div className="overflow-y-auto p-1 flex flex-col">
                        {/* Opción vacía: la traía el <select> nativo y es la
                            única forma de quitar un valor ya elegido en los
                            campos opcionales, como la marca */}
                        {!busqueda && (
                            <button
                                type="button"
                                onClick={() => elegir("")}
                                className="text-left px-3 py-2 rounded-xl text-medium text-text-muted hover:bg-focus-border"
                            >
                                {placeholder}
                            </button>
                        )}

                        {visibles.length === 0 ? (
                            <p className="px-3 py-3 text-small text-text-muted text-center">
                                Sin resultados para "{busqueda}"
                            </p>
                        ) : (
                            visibles.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => elegir(String(opt.value))}
                                    className={`text-left px-3 py-2 rounded-xl text-medium hover:bg-focus-border
                                        ${String(opt.value) === String(value)
                                            ? "text-text-primary font-semibold"
                                            : "text-text-primary"}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))
                        )}

                        {/* Avisa cuando se dejaron de pintar opciones, para que
                            nadie crea que las demás no existen */}
                        {recortado && (
                            <p className="px-3 py-2 text-small text-text-muted text-center border-t border-input-border">
                                Mostrando {visibles.length} de {total}. Escribe para filtrar.
                            </p>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {error && <p className="text-caption text-error place-self-start"> {error}</p>}
        </div>
    )
}
