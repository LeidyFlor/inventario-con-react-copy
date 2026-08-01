// Componente Modal reutilizable — solo maneja el overlay y el contenedor visual
// El contenido va como children

// dismissable={false} evita que se cierre al hacer clic en el fondo. Se usa
// cuando el modal es obligatorio y la única salida es completar la acción.
export default function Modal({ onClose, dismissable = true, children }) {
    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={dismissable ? onClose : undefined}
        >
            <div
                className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}
