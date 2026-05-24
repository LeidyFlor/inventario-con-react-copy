import React from "react";
import clsx from "clsx";
/**
 * IconButton
 * */

export const IconButtonReal = React.forwardRef(function IconButton(
    {
        // Por defecto será un button, pero cuando se necesite anidar 2 botones se necesita que se comporte como un div donde sea llamado (menu hamburguesa)
        as: Component = "button",
        children,
        label, //para texto opcional en el icono
        onClick,
        disabled = false,
        className = "",
        variant = "default",

        //Tamaños
        hitSize = 48,   //px (área táctil)
        iconSize = 24,  //px (ícono visible)

        //Accesibilidad
        ariaLabel,

        //Estados
        isActive = false,

        ...props
    },
    ref
) {
    const baseStyles = `
        inline-flex items-center justify-center
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
    `;

    const variants = {
        default: `
            text-white
            bg-icon-fill-sidebar
            hover:bg-icon-fill-hover
            border-border-icon-sidebar
            hover:border-border-navbar
            focus-visible:ring-blue-500
            border-2
            p-11
            rounded-3xl
            py-11
        `,
        ghost: `
            text-neutral-600
            hover:bg-neutral-100
            focus-visible:ring-neutral-300
        `,
        primary: `
            text-white
            hover:bg-brand-hover
            focus-visible:ring-blue-500
            rounded-2xl
        `,
    };
    return (
        <Component
            ref={ref}
            type={Component === "button" ? "button" : undefined} //type solo si es button
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            className={clsx(baseStyles, 
                variants[variant], 
                className, 
                label && "flex-col h-auto py-2 rounded-2xl", //Si hay labe se vuelve vertical
                {"bg-neutral-300": isActive,
            })}
            style={{
                width: `${hitSize}px`,
                height: `${hitSize}px`,
            }}
            {...props}
        >
            <span
                style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`
                }}
                className="flex items-center justify-center"
            >
                {children}
            </span>
            {/* Solo aparece si se pasa label */}
            {label && (
                <span className="text-small mt-1 text-center leading-tight ">
                    {label}
                </span>
            )}
        </Component>
    );
});
