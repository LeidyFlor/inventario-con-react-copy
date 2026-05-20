// src/shared
//Mejorado: accesibilidad, props defensivas, loading, erros, disabled y estilos desacoplados
import { forwardRef } from "react"; //Acceso a los elementos dentro de un padre. expone los nodos dentro del componente
import { Search, X, LoaderCircle } from "lucide-react";
//Libreria para colocar condiciones de clases
import clsx from "clsx";


const baseStyles = "search flex items-center rounded-xl px-3 transition-all border";

const sizeStyles = {
    sm: "h-9 text-sm",
    md: "h-12 text-sm",
    lg: "h-12 text-base",
};
const variantStyles = {
    //Filled: campo con rondo relleno, borde minimo o sutil (Material "filled TextField").
    filled: "bg-neutral-100 border-border-strong hover:border-blue-700 focus-withing:bg-white",

    //Outlined: campo con fondo transparente y borde visible siempre
    outlined: "bg-transparent border-green-500 hover:border-green-600",
};
//Para utilizar forwardRef se debe usar como constatnte, si no se bloquea
const SearchField = forwardRef(
    
    (
        {
            value = "",
            placeholder = "Buscar",
            onChange = () => { },
            onSubmit,
            onClear = () => { },
            size = "md",
            variant = "filled",
            fullWidth = false,
            disabled = false,
            loading = false,
            error = false,
            name = "search",
            ariaLabel = "Campo de busqueda",
            autoComplete = "off",
            icon,
            className,
        },
        ref
    ) => {
        const SerchIcon = icon || Search;

        const handleClear = () => {
            onChange("");
            onClear();
        };

        const handleSubmit = (e) => {
            e.preventDefault();

            if (disabled || loading) return;

            onSubmit?.(value);
        };

        return (
            <form
                onSubmit={handleSubmit}
                className={clsx(
                    baseStyles,
                    sizeStyles[size],
                    variantStyles[variant],
                    fullWidth && "w-full",
                    disabled && "opacity-60 pointer-events-none",
                    error
                        ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
                        : "focus-within:ring-2 focus-within:ring-text-primary",
                    className,

                )}
                
            >

                {loading ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin text-neutral-500" />
                ) : (
                        <SerchIcon className="size-4 shrink-0 text-text-primary" />
                )}
                <input
                    ref={ref}
                    type="serch"
                    name={name}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                    autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    className="serch__input flex-1 bg-transparent px-2 outline-none"
                />
                {/* !!value -> convierte el valor a booleano con las dos !! */}
                {!!value && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Limpiar busqueda"
                        className="search__clear rounded-full p-1 hover:bg-neutral-200"
                    >
                        <X className="size-4 text-neutral-500" />
                    </button>
                )}
            </form>
        );
    }
);

SearchField.displayName = "SearchField";

export default SearchField;