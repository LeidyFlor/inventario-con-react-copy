/* Componente boton
Boton reutilizable con cariables viauales y tamanos controlados, area interactiva minima de 48px
*/


export default function Button({
    variant = "primary", //Define el estilo visual, variante por defecto
    size = "md",     //Define tamano visual
    type = "button", //Tipos de boton (button, submit, reset)
    children,       //Contenido interno del boton(texto, icono)
    ...props        //Propiedades adicionales(onClick, diseable, etc)
}) {
    const variants = {
        primary: "bg-boton-fill-color-primary text-boton-text-color-primary text-medium font-medium hover:border-gradient-primary hover:text-tertiary-950",/*boton add*/
        secondary: "bg-boton-fill-color-secondary text-body font-medium hover:border-gradient-back text-white hover:text-secundary-900",
        warning: "bg-gradient-warning text-black hover:border-gradient-warning font-medium",
        outline: "bg-gradient-outline text-white text-medium hover:border-2 hover:border-border-default-button",
        ghost: "border-gradient-outline text-quaternary-950 text-medium font-medium hover:bg-gradient-ghost hover:text-white hover:border-0",
    };
    // before: -inset - y - [6px] area tactil del boton de y
    const sizes = {
        sm: `
        h-9 px-4
        before:absolute before:content-['']
        before:-inset-y-[7px] before:-inset-x-[0px]
    `,
        md: `
        h-10 px-8
        before:absolute before:content['']
        before:-inset-y-[6px] before:-inset-x-[0px]
    `
    }
    return (
        <button
            type ={type}
            className={`
            relative
            inline-flex items-center justify-center
            rounded-3xl
            transition-colors
            ${variants[variant]}
            ${sizes[size]}
        `}

            {...props}
        >

            {children}


        </button>
    )
}