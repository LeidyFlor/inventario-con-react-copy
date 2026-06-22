// Componente de fecha reutilizable

export default function DateInput({
    label,
    type = "text",
    value,
    ...props
}) {
    // cuerpo de la funcion
    return (
        // Contenedor del input
        <div className="w-37.5">

            {/* Contenedor del inputt */}
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
                    value={value}
                    className={`
                        bg-transparent
                        focus:outline-none
                        w-full
                        ${value ? "text-text-primary" : "text-text-muted"}
                    `}
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