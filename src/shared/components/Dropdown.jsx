import {
    useContext, //Consume el estado en cualquier subcomponente(Button,     menu, item)
    createContext, //Define un contenedor de datos
    useEffect, 
    useRef, 
    useState, 
    cloneElement
} from "react";

export const DropdownContext = createContext(null)//contenedor empieza vacio

export function Dropdown({
    children,
    open: controlledOpen,
    onOpenChange,
    className = "",
}) {
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

    //Click outside o fuera de componente
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
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
        //Inyecta el estado compartido al dropdown
        <DropdownContext.Provider value={{ open, setOpen }}>
            <div ref={containerRef} className={`relative inline-block ${className}`}>
                {children}
            </div>
        </DropdownContext.Provider>
    )
}
// Trigger (asChild pattern)
export function DropdownTrigger({ children }) {
    const { open, setOpen } = useContext(DropdownContext)

    if (!children) return null

    return cloneElement(children, {
        onClick: (e) => {
            children.props.onClick?.(e)
            setOpen(!open)
        },
        "aria-expanded": open,
        "aria-haspopup": "menu"
    })
}
//Content
export function DropdownContent({ children, className = "" }) {
    const { open } = useContext(DropdownContext);

    if (!open) return null

    return (
        <div
            role="menu"
            className={`
            absolute
            z-50
            mt-1
            min-w-48
            border
            border-white
            text-text-primary
            p-1
            bg-background-dropdown
            backdrop-blur-[1px]
            shadow-lg
            rounded-2xl
            overflow-hidden
            hover:shadow-black
            transition-shadow duration-700
            ${className}    
        `}
        >
            {children}
        </div>
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