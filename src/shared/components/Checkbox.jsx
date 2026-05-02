//Los label no aceptan clases, se usan id. Css solo clases
export default function Checkbox({
    id,     //Identificador único (necesario para accesibilidad) logica para js
    name,   //Nombre del campo (útil pra formulario)
    label,  //Texto visible asociado al checkbox
    checked = false, //Estado controlado del checkbox
    onChange,   //Función que maneja el cambio de estado
    disabled = false,    //Indica si el checkbox está habilitado
    className = "", //Clases adicionales para personalización
}) {

    return (
        <label
            htmlFor={id}
            className={`
            flex items-center gap-2
            text-small
            cursor-pointer
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${className}
        `}

        >
            {/* {Input del checkbox} */}
            <input
                id={id}
                name={name}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                className="w-5 h-5 bg-amber-700"
            />

            {/* Texto del checkbox */}
            <span>{label}</span>
        </label>
    );
}