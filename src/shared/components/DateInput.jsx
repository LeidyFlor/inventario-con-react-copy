// Componente de fecha reutilizable

export default function DateInput({
    label,
    type = "text",
    ...props
    // props son las propiedades del componente
}) {
    // cuerpo de la funcion
    return (
        // Contenedor del input
        <div className="w-37.5">

            {/* Contenedor del input */}
            <div className="
                relative
                h-14
                flex
                flex-col
                justify-center
                rounded-2xl
                border-2
                border-input-border
                bg-input-fill
                px-4
            ">
                {/* Label pequeño arriba */}
                {label && (
                    <span className="text-xs text-text-primary">
                        {label}
                    </span>
                )}

                {/* Area visual del input */}
                <input
                    type={type}
                    placeholder="DD/MM/AAAA"
                    className="
                        bg-transparent
                        text-text-primary
                        placeholder-text-primary
                        focus:outline-none
                        w-full
                    "
                    {...props}
                >
                </input>

            </div>

            {/* Feedback message */}
            <div>
            </div>

        </div>
    )
}