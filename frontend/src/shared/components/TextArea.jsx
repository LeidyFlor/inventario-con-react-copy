// Componente que se va a exportar

export default function Textarea({
    label,
    rows = 4,
    className = "", //para definir ancho del contenedor
    error,
    variant = "default",
    ...props
    // porps son las propiedades de un componenete. rows controla el tamaño del textarea
}) {
    const variants = {
        //Variante normal de formularios (fondo amarillo borde gris)
        default: "rounded-2xl border-2 border-input-border text-medium text-text-primary bg-input-fill placeholder-text-muted hover:border-2 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring",
        //Variante cuando se edita un campo común (borde botton multicolor)
        isEdit: "border-gradient-input-edit rounded-t-xl text-medium text-text-secundary placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
        //Variante cunaod se edita el nombre de elementos (border botton verde)
        nameEdit: "border-b-2 border-border rounded-t-xl text-body font-semibold text-text-secundary text-center placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
    }
    

    // cuerpo de la funcion
    return (
        //Contenedor del textarea que se exporta con label, cuerpo y feedback message
        <div className={`"w-full" ${className}`}>
            {/* Label  Por fuera*/}
            {/* LABEL. JWT evalua si tal es 1, si si lo hace  */}
            {label && (
                <label
                    className={
                    `block
                    text-caption
                    mb-1
                    place-self-start

                    ${error ? "text-error" : "text-text-primary"}
                    `}
                >
                    {label}

                </label>
            )}

            {/* contenedor del textarea */}
            {/* este classname permite escribir en todos los campos */}
            <div className={`
                relative
                flex
                items-start
            `}>
                {/* Area interactiva invisible*/}

                { (
                    <div
                        className={`
                        absolute
                        inset-0
                        `}

                        onMouseDown={(e) => {
                            e.preventDefault();
                            /*Mueve el foco al siguiente elemento hermano el elemento actual*
                            `currentTarget` referencia el elemento que tiene el handler del evento
                            `nextSibling` obtiene el siguinete nodo en el DOM (puede ser un textarea u otro elemento)*/
                            e.currentTarget.nextElementSibling.focus(); /*Linea de codigo de area disponible de 48px */
                        }}
                    />
                )}

                {/* Area visual del textarea */}
                {/* border-border es el color del borde con variables */}
                <textarea
                    rows={rows}
                    className={`
                        relative
                        w-full
                        px-4
                        py-3
                        resize-none
                        transition-all 
                        duration-300
                        ${variants[variant]}
                        ${error ? "border-2 border-red-800" : "text-text-primary"}
                    `}
                    {...props}
                />

            </div>
            {/* Feedback message */}
            <div>
                {error && <p className="text-caption text-error place-self-start">{error}</p>}
            </div>
        </div>
    )
};