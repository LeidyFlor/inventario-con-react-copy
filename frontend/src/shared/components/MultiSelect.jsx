import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Checkbox from './Checkbox';
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { filtrarOpciones } from "./utils/filtrarOpciones";
import { useDesplegableFlotante, useCerrarAlClicarFuera } from "./utils/useDesplegableFlotante";

export default function MultiSelect({
    label,
    name,
    options = [],
    value = [],
    onChange,
    error,
    variant = "default",
    required,

    // Ancho del campo.
    //
    // Por defecto ocupa todo el espacio disponible, que es lo correcto cuando
    // el contenedor padre tiene un ancho definido.
    //
    // Cuando el padre se ajusta al contenido (w-fit), hay que pasarle un ancho
    // fijo. Si no, el texto de las opciones seleccionadas hace crecer el campo,
    // y con él toda la columna y el formulario. En ese caso min-w-0 no ayuda:
    // no existe un ancho contra el cual encoger.
    //
    // Los formularios de material usan "w-full lg:w-60": fijo en escritorio,
    // donde el espacio es limitado por la rejilla de varias columnas, y libre
    // en móvil, donde el formulario es de una sola columna y el ancho lo manda
    // la pantalla.
    widthClass = "w-full",
}) {
    const variants = {
        default: "rounded-2xl border-2 border-input-border text-medium text-text-primary bg-input-fill placeholder-text-muted hover:border-2 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring",
        isEdit: "border-gradient-input-edit border-0 rounded-t-xl text-medium text-text-secundary placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
        nameEdit: "border-b-2 border-border rounded-t-xl text-body font-semibold text-text-secundary text-center placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
    }
    const [open, setOpen] = useState(false)
    const [busqueda, setBusqueda] = useState("")
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    // El menú se dibuja en un portal para que los contenedores con
    // overflow-hidden de los formularios no lo recorten, y se voltea hacia
    // arriba cuando abajo no cabe
    const { anclaRef, flotanteRef, estilo } = useDesplegableFlotante(open)

    // Se pasan los dos refs: al estar el menú en un portal, un clic dentro de
    // él NO cuenta como clic fuera del campo
    useCerrarAlClicarFuera([containerRef, flotanteRef], () => setOpen(false))

    // Al abrir, el cursor queda en el buscador para poder escribir de una vez.
    // Al cerrar se limpia, para que la próxima vez la lista salga completa.
    useEffect(() => {
        if (open) inputRef.current?.focus()
        else setBusqueda("")
    }, [open])

    // El mismo filtro que usa Select, para que los dos busquen igual
    const { visibles, total, recortado } = filtrarOpciones(options, busqueda)

    return (
        // min-w-0 permite encoger el input si el espacio no da
        <div className={`${widthClass} relative min-w-0`} ref={containerRef}>
            {/* si se ingresa label: */}
            {label && (
                <label className={`
                block
                text-caption
                mb-1
                place-self-start
                ${error ? "text-error" : "text-text-primary" }
                `}>
                {label}
                    {required && <span className="text-error ml-0.5 text-small">*</span>}

                </label>
            )}
            {/* campo que abre el dropdown */}
            {/*  trigger */}
            {/* overflow-hidden refuerza el truncate del texto: sin él, un
                nombre muy largo podría desbordar el borde del campo */}
            <div ref={anclaRef} onClick={() => setOpen(prev => !prev)}
                className={`w-full
                h-10
                px-4
                py-2
                flex
                items-center
                justify-between
                overflow-hidden
                transition-all duration-300
                ${variants[variant]}
                ${error ? "border-2 border-red-800" : "border border-border"}
                `}>
                {/* flex-1 min-w-0 truncate: la combinación que corta el texto
                    con "..." en vez de estirar el campo. min-w-0 es
                    imprescindible, porque por defecto un hijo flex no se
                    encoge más allá de su contenido. */}
                <span className={`${value.length === 0 ? "text-text-muted" : "text-text-primary"}
                    flex-1 min-w-0 truncate text-left
                `}>
                    {value.length === 0
                        ? "Selecciona una opción"
                        : options
                            .filter(opt => value.includes(String(opt.value)))
                            .map(opt => opt.label)
                            .join(", ")
                    }
                </span>
                <span className="text-xs shrink-0">{open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
                
            </div>
            {/* Dropdown con checkboxes */}
            {open && createPortal(
                <div
                    ref={flotanteRef}
                    style={estilo}
                    // z-[60] para quedar por encima de los modales, que usan z-50
                    className="z-[60] bg-input-fill border-2 border-input-border rounded-2xl shadow-lg overflow-hidden flex flex-col"
                >
                    {/* Buscador. Filtrar NO desmarca nada: lo ya elegido sigue
                        en value aunque quede fuera de la lista visible. */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-input-border">
                        <Search size={16} className="text-text-muted shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                            placeholder="Buscar..."
                            className="w-full bg-transparent text-medium text-text-primary placeholder-text-muted focus:outline-none"
                        />
                    </div>

                    <div className="overflow-y-auto p-2 flex flex-col gap-1">
                        {/* campos de checkboxes */}
                        {visibles.length === 0 ? (
                            <p className="px-1 py-3 text-small text-text-muted text-center">
                                Sin resultados para "{busqueda}"
                            </p>
                        ) : (
                            visibles.map(opt => (
                                <Checkbox
                                    key={opt.value}
                                    id={`${name}-${opt.value}`}
                                    label={opt.label}
                                    checked={value.includes(String(opt.value))}
                                    onChange={() =>{
                                        const strVal =String(opt.value)
                                        const newValue = value.includes(strVal)
                                            ? value.filter(v => v !== strVal)//si el valor estaba lo quita
                                            : [...value, strVal] //si no estaba lo agrega
                                        onChange(name, newValue)
                                    }}
                                />
                            ))
                        )}

                        {/* Avisa cuando se dejaron de pintar opciones, para que
                            nadie crea que las demás no existen */}
                        {recortado && (
                            <p className="px-1 pt-2 text-small text-text-muted text-center border-t border-input-border">
                                Mostrando {visibles.length} de {total}. Escribe para filtrar.
                            </p>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {error && <p className="text-caption text-error">{error}</p>}
        </div>
    )
}