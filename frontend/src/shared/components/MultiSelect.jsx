import { useState, useRef, useEffect } from "react";
import Checkbox from './Checkbox';
import { ChevronDown, ChevronUp } from "lucide-react";

export default function MultiSelect({
    label,
    name,
    options = [],
    value = [],
    onChange,
    error,
    variant = "default"
}) {
    const variants = {
        default: "rounded-2xl border-2 border-input-border text-medium text-text-primary bg-input-fill placeholder-text-muted hover:border-2 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring",
        isEdit: "border-gradient-input-edit border-0 rounded-t-xl text-medium text-text-secundary placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
        nameEdit: "border-b-2 border-border rounded-t-xl text-body font-semibold text-text-secundary text-center placeholder-text-muted hover:rounded-2xl hover:border-2 hover:border-focus-border transition-all-duration-10 focus:outline-none focus:ring-1 focus:ring-focus-ring",
    }
    const [open, setOpen] = useState(false)
    const containerRef = useRef(null)

    //Cierra dropdown al hacer click afuera
    useEffect(() => {
        function handleClickOutside(e){
            if (containerRef.current && !containerRef.current.contains(e.target)){
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        // min-w-0 permite encoger el input si el espacio no da
        <div className="w-full relative min-w-0" ref={containerRef}>
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
                </label>
            )}
            {/* campo que abre el dropdown */}
            {/*  trigger */}
            <div onClick={() => setOpen(prev => !prev)}
                className={`w-full
                h-10
                px-4
                py-2
                flex 
                items-center 
                justify-between
                transition-all duration-300
                ${variants[variant]}
                ${error ? "border-2 border-red-800" : "border border-border"}
                `}>
                <span className={`${value.length === 0 ? "text-text-muted truncate": "text-text-primary"}
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
            {open &&(
                <div className="absolute z-50 w-full mt-1 bg-input-fill border-2 border-input-border rounded-2xl shadow-lg max-h-48 overflow-y-auto p-2 flex flex-col gap-1 ">
                    {/* campos de checkboxes */}
                    {options.map(opt => (
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
                    ))}
                </div>
            )}

            {error && <p className="text-caption text-error">{error}</p>}
        </div>
    )
}