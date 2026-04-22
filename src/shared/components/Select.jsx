export default function Select({
    label,
    name,
    error,
    value,
    onChange,
    options = [],
}) {


    return (
        <div className="w-[320px]">
            {/* si label trae algo hace lo que esta adentro */}
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
                </label>
            )}

            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`
                    w-full
                    h-12
                    text-medium
                    rounded-2xl
                    border-2
                    border-input-border
                    px-4
                    bg-input-fill

                    hover:border-2
                    hover:border-focus-border

                    focus:outline-none
                    focus:ring-1
                    focus:ring-focus-ring
                    transition-all duration-300
                    ${error ? "border-red-800" : "border border-border"}
                    `}
            >
                <option value="">Seleccione una opcion</option>
                {/* Se mapean el arreglo de las opciones que llegan */}
                {options.map((opt) => (
                    // en este caso key: C.C. y Value: Cedula de ciudadania
                    <option key={opt.id} value={opt.id}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {/* Feedback message */}
            {error && <p className="text-caption text-error place-self-start"> {error}</p>}
        </div>
    )
}