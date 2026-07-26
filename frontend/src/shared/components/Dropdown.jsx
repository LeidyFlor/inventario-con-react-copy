import {
    useContext, //Consume el estado en cualquier subcomponente(Button,     menu, item)
    createContext, //Define un contenedor de datos
    useEffect, useRef, useState
} from "react";
import { createPortal } from "react-dom";

export const DropdownContext = createContext(null)//contenedor empieza vacio

export function Dropdown({
    children,
    open: controlledOpen,
    onOpenChange,
    className = "",
}) {
    // Para saber la posiscion del trigger
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    
    //value: representa la opcion activa actual
    const setOpen = (value) => {
        if (isControlled) {
            onOpenChange?.(value)
        } else {
            setUncontrolledOpen(value)
        }
    }
    //useRef: Se usa oara referenciar el trigger o un menun del DropDown
    //El trigger es el elemento que abre o cierra el componente
    const containerRef = useRef(null)
    const contentRef = useRef(null) 

    //Click outside o fuera de componente
    useEffect(() => {
        const handleClickOutside = (e) => {
            const clickedInsideContent = contentRef.current?.contains(e.target)
            const clickedInsideTrigger = containerRef.current?.contains(e.target)
            if (!clickedInsideTrigger && !clickedInsideContent) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, []);

    //Escape key o tecla escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") setOpen(false)
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, []);

    return (
        //Inyecta el estado compartido al dropdown, se exporta trigeerRef y pos con el contexto
        <DropdownContext.Provider value={{ open, setOpen, triggerRef, pos, setPos, contentRef }}>
            <div ref={containerRef} className={`inline-block ${className}`}>
                {children}
            </div>
        </DropdownContext.Provider>
    )
}
// Trigger (asChild pattern), para caluclar la posisicon al abirir
export function DropdownTrigger({ children }) {
    const { open, setOpen, setPos } = useContext(DropdownContext)
    const triggerRef = useRef(null)  // 👈 ref local

    if (!children) return null

    //cloneElemnt y ref no se pudeen usar a la vez, se replaza el clone por un handle que si maneja el evento
    const handleClick = (e) => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const dropdownHeight = 200
            const dropdownWidth = 192 // min-w-48 = 192px

            // ¿Cabe abajo?
            const fitsBottom = rect.bottom + dropdownHeight < window.innerHeight
            // ¿Cabe a la derecha?
            const fitsRight = rect.left + dropdownWidth < window.innerWidth
            setPos({
                
                top: fitsBottom
                    ? rect.bottom + 4
                    : rect.top - dropdownHeight - 4,  // 👈 se abre hacia arriba

                left: fitsRight
                    ? rect.left    // alinea a la izquierda del trigger (inicio)
                    : rect.right - dropdownWidth  // 👈 alinea a la derecha del trigger (fin)
            })
        }
        children.props.onClick?.(e)
        setOpen(!open)
    }

    return (
        //Contededor de referencia invisible
        <span
            ref={triggerRef}   // 👈 el ref va en el span, no en el children
            onClick={handleClick}
            aria-expanded={open}
            aria-haspopup="menu"
            style={{ display: "inline-block" }}
        >
            {children}
        </span>
    )
}
//Content
export function DropdownContent({ children, className = "" }) {
    const { open, pos, contentRef } = useContext(DropdownContext);

    if (!open) return null
    
    //El portal saca el drop-down-context de la logica de react 
    return createPortal(
        <div
            role="menu"
            ref={contentRef}
            style={{
                position: "fixed",
                top: pos.top,    // posición calculada del trigger 🔫
                left: pos.left,
            }}
            className={`
            fixed
            overflow-hidden
            mt-1
            min-w-48
            border
            text-text-primary
            font-medium
            p-1
            z-100
            bg-background
            backdrop-blur-[1px]
            shadow-lg
            rounded-2xl
            hover:shadow-black
            transition-shadow duration-700
            ${className}    
        `}
        >
            {children}
        </div>,
        document.body  // 👈 se renderiza fuera del sidebar, lo hace en el body
    )
}
//Item
export function DropdownItem({
    children,
    onClick,
    className = ""
}) {
    const { setOpen } = useContext(DropdownContext);

    const handleClick = (e) => {
        onClick?.(e)
        setOpen(false)
    }

    return (
        <button
            role="menuitem"
            onClick={handleClick}
            className={`
                w-full text-left px-3 py-2 rounded-lg 
                hover:bg-gray-500 hover:text-text-inverse focus:bg-gray-100
                transition-colors
                ${className}    
            `}
        >
            {children}
        </button>
    );
}