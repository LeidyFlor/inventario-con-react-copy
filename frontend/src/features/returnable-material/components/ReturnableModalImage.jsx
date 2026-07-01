import { X } from "lucide-react";
import { Button, FileInput, IconButtonReal } from "@/shared";

export default function ImageModal({
    isOpen,
    onClose,
    currentImage,
    newImageFiles,
    setNewImageFiles,
    showFileInput,
    setShowFileInput,
    materialName,
}) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">

            <div className="bg-background rounded-3xl p-6 w-[700px] max-w-[90vw]">

                {/* Encabezado */}
                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-h3 font-bold">
                        Imagen del elemento
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

                    <p className="text-text-muted text-small text-center">
                        1 archivo: PDF, PNG, JPG. Máx 10MB.
                    </p>

                    {!showFileInput && (
                        currentImage || newImageFiles.length > 0 ? (

                            <img
                                src={
                                    newImageFiles.length > 0
                                        ? URL.createObjectURL(newImageFiles[0])
                                        : currentImage
                                }
                                alt="Imagen del material"
                                className="w-60 h-60 object-cover rounded-xl"
                            />

                        ) : (

                            <div className="w-60 h-60 rounded-xl flex items-center justify-center bg-surface border-2 border-input-border">

                                <span className="text-5xl font-bold">
                                    {materialName?.charAt(0).toUpperCase()}
                                </span>

                            </div>

                        )
                    )}

                    {!showFileInput ? (

                        <Button
                            variant="primary"
                            type="button"
                            onClick={() => setShowFileInput(true)}
                        >
                            Cambiar imagen
                        </Button>

                    ) : (

                        <FileInput
                            value={newImageFiles}
                            onChange={(files) => {

                                setNewImageFiles(files);

                                if (files.length > 0) {
                                    setShowFileInput(false);
                                }
                            }}
                            multiple={false}
                        />

                    )}

                </div>

            </div>

        </div>
    );
}