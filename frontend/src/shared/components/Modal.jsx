// Componente Modal reutilizable — solo maneja el overlay y el contenedor visual
// El contenido va como children

export default function Modal({ onClose, children }) {
    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
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
