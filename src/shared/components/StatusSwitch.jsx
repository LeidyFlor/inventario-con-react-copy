//Hooks de react para manejar estados y efectos
import { useEffect, useState } from "react";

//Iconos usados dentro del switch
import { Check, X } from "lucide-react";

//Componente reutilizable para representar un switch de estado (activo/inactivo)
export default function StatusSwitch({
    checked = false,    //Valor inicial del switch (controlado desde el padre)
    onChange,           //Callback que se ejecuta cuando cambia el estado
    disabled = false,   //Permite deshabilitar la interaccion
    size = "md",        //Tamaño de switch (sm, md, lg)
    className,
    type = "button"
}) {

    //Estado interno del componente
    //Se inicializa con el valor recibido desde la prop "checked"
    const [isActive, setIsActive] = useState(checked);

    //Efecto que se sincroniza el estado interno
    //con el valor recibido desde el componente padre
    useEffect(() => {
        setIsActive(checked);
    }, [checked]); //se ejecuta cada vez que cambia "checked"

    //Funcion que maneja el cambio del switch
    const handleToggle = () => {

        //si el switch esta deshabilitado no permite interaccion, el return rompe la ejecucion
        if (disabled) return;

        //calcula el nuevo estado (invierte el valor actual)
        const newValue = !isActive;

        //Actualiza el estado interno
        setIsActive(newValue);

        //Si existe un callback onChange, se ejecuta
        //Enviando el nuevo valor al componente padre
        if (onChange) {
            onChange(newValue);
        }
    };

    //Clases de tamaño del contenedor del switch
    const sizes = {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-6 w-6",
    };
    //Clases del tamano del know (el circulo que se mueve)
    const knobSizes = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    };

    return (

        //Boton que funciona como switch
        <button
            type={type}
            onClick={handleToggle}      //Evento que cambia el estado
            disabled={disabled}         //Permite deshabilitar el boton
            className={`

                    //Posicionamiento base del switch
                    relative items-center

                    //Forma redondeada del contenedor
                    rounded-full transition-colors

                    //Tamaño dinamico segun la prop "size"
                    ${sizes[size]}

                    //Color dependiendo del estado
                    ${isActive ? "bg-green-500" : "bg-gray-300"}

                    // Estilo cuando esta deshabilitado
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}

                    ${className}
                `}
        >

            {/* "knob" del switch (el circulo que se mueve de isquierda a derecha)*/}
            <span
                className={`
                    absolute left-0.5 flex items-center justify-center
                    
                    //Forma del knob
                    rounded-full bg-white shadow

                    //Animacion del movimiento
                    transition-transform

                    //Tamaño dinamico del knob
                    ${knobSizes[size]}

                    //Posicion dependiendo del estado
                    ${isActive ? "translate-x-full" : "translate-x-0"}
                `}
            >

                {/* 
                    Icono que se cambia dependiendo del estado
                    ✅ activo
                    ❌ inactivo
                */}
                {isActive ? (
                    <Check size={12} className="text-gray-600" />
                ) : (
                    <X size={12} className="text-gray-500" />
                )}
            </span>

        </button>
    );
}