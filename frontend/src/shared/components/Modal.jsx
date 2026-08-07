import { ArrowLeft, X } from "lucide-react";
import Button from "./Button";
import { IconButtonReal } from "./IconButtonReal";

/**
 * Contenedor único para todos los modales de la aplicación.
 *
 * Solo unifica el envoltorio: fondo, título y la botonera opcional del pie.
 * El contenido va como children y cada pantalla lo arma como necesite.
 *
 * El fondo siempre es blanco (bg-background), a propósito: los modales
 * contienen formularios, tablas e imágenes, y un fondo con degradado obligaba
 * a pelear con el contraste en cada caso.
 *
 * @param {Function} onClose        Cierra el modal
 * @param {string}   title          Título opcional
 * @param {string}   titleVariant   "plain" (sobrio) o "gradient" (con degradado y línea)
 * @param {string}   size           sm | md | lg | xl — ancho máximo de la caja
 * @param {boolean}  dismissable    Si false, no se cierra al hacer clic en el fondo
 * @param {string}   confirmLabel   Si viene, se muestra el botón principal
 * @param {Function} onConfirm      Acción del botón principal
 * @param {boolean}  confirmDisabled
 * @param {string}   cancelLabel    Si viene, se muestra el botón secundario
 * @param {Function} onCancel       Acción del botón secundario (por defecto, onClose)
 * @param {Function} onBack         Si viene, muestra la flecha de regreso arriba
 *                                  a la izquierda, al lado del título
 * @param {string}   backLabel      Texto accesible de esa flecha
 */
export default function Modal({
    onClose,
    title,
    titleVariant = "plain",
    size = "md",
    dismissable = true,

    confirmLabel,
    onConfirm,
    confirmDisabled = false,
    cancelLabel,
    onCancel,

    onBack,
    backLabel = "Atrás",

    children,
}) {
    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
        xl: "max-w-5xl",
    }

    // Solo se dibuja el pie si al menos un botón fue solicitado
    const hayBotones = Boolean(confirmLabel || cancelLabel)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={dismissable ? onClose : undefined}
        >
            <div
                className={`bg-background rounded-2xl shadow-2xl w-full ${sizes[size]}
                    max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4`}
                // Evita que un clic dentro de la caja llegue al fondo y la cierre
                onClick={(e) => e.stopPropagation()}
            >
                {/* Encabezado: flecha de regreso (opcional) + título.
                    La flecha cumple la función de "Atrás" y por eso va arriba
                    a la izquierda, no en la botonera del pie. */}
                {(onBack || title) && (
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <IconButtonReal
                                variant="ghost"
                                onClick={onBack}
                                ariaLabel={backLabel}
                                hitSize={36}
                                iconSize={20}
                            >
                                <X size={20} />
                            </IconButtonReal>
                        )}

                        {title && (
                            titleVariant === "gradient" ? (
                                <div className="max-w-max">
                                    <h2 className="text-gradient-title text-h3 pb-0.5">{title}</h2>
                                    <div className="h-0.5 bg-gradiant-title-line"></div>
                                </div>
                            ) : (
                                // flex-1 para que el texto siga centrado aunque
                                // la flecha ocupe espacio a la izquierda
                                <h2 className="flex-1 text-text-primary font-semibold text-center">
                                    {title}
                                </h2>
                            )
                        )}
                    </div>
                )}

                {children}

                {hayBotones && (
                    <div className="flex justify-center gap-3 pt-2">
                        {cancelLabel && (
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={onCancel ?? onClose}
                            >
                                {cancelLabel}
                            </Button>
                        )}
                        {confirmLabel && (
                            <Button
                                type="button"
                                size="md"
                                variant="primary"
                                showIcon={false}
                                disabled={confirmDisabled}
                                onClick={onConfirm}
                            >
                                {confirmLabel}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
