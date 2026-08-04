import { X } from "lucide-react";
import { TechnicalFilesInput, IconButtonReal } from "@/shared";

/**
 * Modal de fichas técnicas. Lo usan los dos tipos de material, tanto en los
 * formularios (edición) como en las pantallas de visualizar (solo lectura).
 *
 * Antes vivía en features/returnable-material; se movió aquí porque ahora los
 * materiales de consumo también manejan fichas técnicas.
 *
 * @param {boolean} readOnly  Modo consulta: oculta Subir y Eliminar, y deja
 *                            solo el botón para abrir cada archivo. Sirve para
 *                            que alguien sin permiso de edición pueda ver las
 *                            fichas desde la pantalla de visualizar.
 */
export default function TechnicalFilesModal({
    isOpen,
    onClose,
    existingFiles,
    setExistingFiles,
    newTechFiles,
    setNewTechFiles,
    setRemovedFileIds,
    readOnly = false,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">

            <div className="bg-background rounded-3xl p-6 w-[750px] max-w-[90vw]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-h3 font-bold">
                        Fichas técnicas
                    </h2>

                    <IconButtonReal
                        variant="outline"
                        onClick={onClose}
                        arialLabel="Cerrar"
                    >
                        <X size={28} />
                    </IconButtonReal>

                </div>

                {/* Contenido */}
                <div className="flex flex-col gap-4 items-center">

                    <p className="text-text-muted text-small text-center w-72">
                        {readOnly
                            ? "Pasa el cursor sobre un archivo para abrirlo en una pestaña nueva."
                            : "Los archivos marcados \"Guardado\" ya están en el sistema. Puedes agregar más o eliminar los existentes."}
                    </p>

                    {readOnly && existingFiles.length === 0 && (
                        <p className="text-text-muted text-small">
                            Este material no tiene fichas técnicas registradas.
                        </p>
                    )}

                    <TechnicalFilesInput
                        readOnly={readOnly}
                        existingFiles={existingFiles}
                        onRemoveExisting={(fileId) => {
                            setExistingFiles(prev =>
                                prev.filter(f => f.id !== fileId)
                            );

                            setRemovedFileIds(prev => [
                                ...prev,
                                fileId
                            ]);
                        }}
                        newFiles={newTechFiles}
                        onNewFilesChange={setNewTechFiles}
                        accept="image/*,application/pdf"
                    />

                </div>

            </div>
        </div>
    );
}
