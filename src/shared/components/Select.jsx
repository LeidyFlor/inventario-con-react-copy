export default function Select({
    label,
    name,
    error,
    value,
    onChange,
    options = [],
    variant = "default"
}) {
    const variants = {
        default: "rounded-2xl border-2 border-input-border text-medium text-text-primary bg-input-fill placeholder-text-primary hover:border-2 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring",
        isEdit: "border-gradient-input-edit border-0 rounded-t-xl text-medium text-text-secundary placeholder-text-primary hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
        nameEdit: "border-b-2 border-border rounded-t-xl text-body font-semibold text-text-secundary text-center placeholder-text-primary hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
    }

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
                    px-4
                    
                    transition-all duration-300
                    ${variants[variant]}
                    ${error ? "border-2 border-red-800" : "border border-border"}
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