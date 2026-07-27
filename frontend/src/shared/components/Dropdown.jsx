import {
    useContext, //Consume el estado en cualquier subcomponente(Button,     menu, item)
    createContext, //Define un contenedor de datos
    useEffect, useCallback, useRef, useState
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
    const [pos, setPos] = useState({ triggerTop: 0, triggerBottom: 0, left: 0 });
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
            const dropdownWidth = 192 // min-w-48 = 192px

            // ¿Cabe a la derecha?
            const fitsRight = rect.left + dropdownWidth < window.innerWidth

            // Solo se guardan las coordenadas del trigger.
            // La posición vertical final la calcula DropdownContent midiendo
            // su altura real, porque la cantidad de ítems visibles varía
            // según los permisos del usuario.
            setPos({
                triggerTop:    rect.top,
                triggerBottom: rect.bottom,
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

    // Callback ref: React lo llama con el nodo cuando el menú se monta,
    // durante el commit y antes de que el navegador pinte.

    // Se mide la altura real en vez de asumir un valor fijo porque el número
    // de ítems visibles cambia según los permisos del usuario: un menú de 2
    // ítems mide mucho menos que uno de 5, y con una altura fija el menú
    // quedaba flotando separado del botón al abrirse hacia arriba.

    // La posición se escribe directamente en el estilo del nodo en vez de
    // guardarla en un useState, para no provocar un render adicional.
    const setContentRef = useCallback((node) => {
        contentRef.current = node
        if (!node) return

        const height = node.offsetHeight
        const margin = 4

        // ¿Cabe abajo con su altura real?
        const fitsBottom = pos.triggerBottom + height + margin < window.innerHeight

        const finalTop = fitsBottom
            ? pos.triggerBottom + margin
            : Math.max(margin, pos.triggerTop - height - margin)  // se abre hacia arriba

        node.style.top = `${finalTop}px`
        node.style.visibility = "visible"
    }, [pos.triggerTop, pos.triggerBottom, contentRef])

    if (!open) return null

    //El portal saca el drop-down-context de la logica de react
    return createPortal(
        <div
            role="menu"
            ref={setContentRef}
            style={{
                position: "fixed",
                // Valores provisionales: el callback ref los corrige tras medir
                // la altura real. Se oculta mientras tanto para evitar parpadeo.
                top:  pos.triggerBottom + 4,
                left: pos.left,
                visibility: "hidden",
            }}
            className={`
            fixed
            overflow-hidden
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