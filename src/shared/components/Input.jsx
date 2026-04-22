// Componente que se va a exportar

export default function Input({
    label,
    type = "Text",
    labelInside = false,
    className = "", //para definir ancho del contenedor
    error,
    ...props
    // porps son las propiedades de un componenete. Y label para que por defecto el campo sea tipo texto
}) {
    const isDate = type === "date";
    
    // cuerpo de la funcion
    return (
        //Contenedor del input que se exporta con label, cuerpo y feedback message
        <div className={`${isDate ? "w-fit" : "w-[320px]"} ${className}`}>
            {/* Label  Por fuera*/}
            {/* LABEL. JWT evalua si tal es 1, si si lo hace  */}

            {label && !labelInside && (
                <label
                    className={
                    `block
                    text-caption
                    mb-1
                    place-self-start
                    ${error ? "text-error" : "text-text-primary" }
                    `}
                   
                    >
                    {label}

                </label>
            )}
            
            {/* contenedor del input */}
            {/* este classname permite escribir en todos los campos */}
            <div className={`
                relative
                h-12
                flex
                items-center
                ${isDate ? "w-fit" : ""} 
            `}>
                {/* Area interactiva invisibe de un input  48px*/}

                {!isDate &&(
                    <div
                    className={`
                        absolute
                        inset-0
                        `}
                        
                    onMouseDown={(e) => {
                        e.preventDefault();
                        /*Mueve el foco al siguiente elemento hermano el elemento actual*
                        `currentTarget` referencia el elemento que tiene el handler del evento
                        `nextSibling` obtiene el siguinete nodo en el DOM (puede ser un input u otro elemento)*/
                        e.currentTarget.nextElementSibling.focus(); /*Linea de codigo de area disponible de 48px */
                    }}
                     />
                )}

                {/* Area visual del input */}
                {/* border-border es el colo rdel borde con variables */}
                <input
                    // toma el input de cuando se crea el input
                    type={type}
                    size={isDate ? 12: undefined}
                    className={`
                        relative
                        ${isDate ? "w-auto" : "w-full"}
                        h-12
                        rounded-2xl
                        border-2
                        border-input-border
                        px-4
                        text-medium
                        text-text-primary
                        bg-input-fill
                        placeholder-text-primary

                        hover:border-2
                        hover:border-focus-border

                        focus:outline-none
                        focus:ring-1
                        focus:ring-focus-ring
                        transition-all duration-300
                        ${error ? "border-red-800" : "text-text-primary" }

                         ${labelInside && label
                            // Con label dentro: padding superior para dejar espacio al label
                            ? "px-4 pt-4 pb-1"
                            // Sin label dentro: padding normal
                            : "px-4"
                        }

                        
                    `}
                    {...props}
                >
                </input>

                {/* Label DENTRO (flota arriba del texto) */}
                {label && labelInside && (
                    <label className={`
                        absolute
                        top-2
                        left-4
                        text-caption
                        text-text-primary
                        pointer-events-none
                        ${error ? "text-error" : "text-text-primary" }
                    `}>
                        {label}
                    </label>
                )}

            </div>
            {/* Feedback message */}
            <div>
                {error && <p className="text-caption text-error place-self-start">{error}</p>}
            </div>
        </div>
    )
};