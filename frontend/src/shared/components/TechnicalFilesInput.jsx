// src/shared/components/TechnicalFilesInput.jsx
// Variante de FileInput pensada para fichas técnicas en el formulario de edición.
// Maneja dos tipos de archivos al mismo tiempo:
//   - existingFiles: [{id, file_url, file_name}] → ya están en el backend
//   - newFiles:      File[]                       → archivos nuevos por subir
// El padre decide qué hacer con cada grupo al guardar.

import { useRef, useState, useEffect, useMemo } from "react"
import { Infinity as InfinityLoader } from "ldrs/react"
import "ldrs/react/Infinity.css"
import { CloudUpload, ArrowDownToLine } from "lucide-react"

export default function TechnicalFilesInput({
    // Archivos que ya existen en la base de datos
    existingFiles = [],           // [{id, file_url, file_name}]
    onRemoveExisting,             // (id) → void  — llamado al eliminar uno existente

    // Archivos nuevos que el usuario acaba de seleccionar
    newFiles = [],                // File[]
    onNewFilesChange,             // (File[]) → void

    accept = "image/*,application/pdf",
    maxFiles = 3,                 // límite total (existentes + nuevos)

    // Modo consulta: se ven los archivos y se pueden abrir, pero no subir ni
    // eliminar. Lo usan las pantallas de visualizar material, para que alguien
    // sin permiso de edición igual pueda consultar las fichas.
    readOnly = false,
}) {
    const inputRef = useRef()
    const [isLoading, setIsLoading] = useState(false)
    const [dragIndex, setDragIndex] = useState(null) // solo aplica a newFiles

    //  Utilidades de tipo 

    // Discrimina si un archivo existente es imagen por su extensión en la URL
    const existingIsImage = (file) => {
        const url = file.file_url?.toLowerCase() ?? ""
        return url.includes(".jpg") || url.includes(".jpeg") ||
               url.includes(".png") || url.includes(".webp") || url.includes(".gif")
    }

    // Discrimina si un File nuevo es imagen por su MIME type
    const newIsImage = (file) => file.type.startsWith("image/")

    //  Previews para archivos nuevos (ObjectURL) 
    const newPreviews = useMemo(
        () => newFiles.map((f) => (newIsImage(f) ? URL.createObjectURL(f) : null)),
        [newFiles]
    )

    // Limpia ObjectURLs cuando cambia la lista (previene memory leaks)
    useEffect(() => {
        return () => {
            newPreviews.forEach((url) => { if (url) URL.revokeObjectURL(url) })
        }
    }, [newPreviews])

    //  Agregar archivos nuevos 
    const handleFiles = async (files) => {
        setIsLoading(true)
        await new Promise((r) => setTimeout(r, 500))

        const incoming = Array.from(files)
        const combined = [...newFiles, ...incoming]

        // Respeta el límite total descontando los existentes
        const remaining = maxFiles - existingFiles.length
        onNewFilesChange(combined.slice(0, remaining))

        setIsLoading(false)
    }

    //  Eliminar archivo nuevo 
    const removeNew = (i) => {
        const copy = [...newFiles]
        copy.splice(i, 1)
        onNewFilesChange(copy)
    }

    //  Reordenar archivos nuevos por drag & drop 
    const reorderNew = (from, to) => {
        const copy = [...newFiles]
        const [moved] = copy.splice(from, 1)
        copy.splice(to, 0, moved)
        onNewFilesChange(copy)
    }

    //  Cuántos archivos más se pueden agregar
    const canAddMore = !readOnly && existingFiles.length + newFiles.length < maxFiles

    return (
        <div className="grid grid-cols-3 gap-2">

            {/*  Archivos existentes del backend  */}
            {existingFiles.map((file) => (
                <div
                    key={`existing-${file.id}`}
                    className="relative w-16 h-16 border rounded overflow-hidden group"
                >
                    {existingIsImage(file) ? (
                        // Muestra la imagen directamente desde su URL en Supabase
                        <img
                            src={file.file_url}
                            alt={file.file_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        // Archivo no-imagen: muestra nombre truncado
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-[10px] px-1">
                            <span className="font-semibold">PDF</span>
                            <span className="truncate w-full text-center">{file.file_name}</span>
                        </div>
                    )}

                    {/* Badge que indica que este archivo ya está guardado */}
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">
                        Guardado
                    </span>

                    {/* Botones que aparecen al hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/30 gap-2">
                        {/* Descargar / abrir en el navegador */}
                        <button
                            type="button"
                            // funcion nativa que abre el archivo en una pestana nueva
                            onClick={() => window.open(file.file_url, '_blank')}
                            className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow text-brand"
                            title="Abrir archivo"
                        >
                            <ArrowDownToLine size={14} />
                        </button>
                        {/* Eliminar — oculto en modo consulta */}
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => onRemoveExisting(file.id)}
                                className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow text-error text-xs"
                                title="Eliminar archivo"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/*  Archivos nuevos (File objects, aún no subidos)
                 En modo consulta no existen: no se puede subir nada  */}
            {!readOnly && newFiles.map((file, i) => (
                <div
                    key={`new-${i}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => reorderNew(dragIndex, i)}
                    className="relative w-16 h-16 border-2 border-brand/50 rounded overflow-hidden group"
                >
                    {newIsImage(file) ? (
                        <img src={newPreviews[i]} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-[10px] px-1">
                            <span className="font-semibold">PDF</span>
                            <span className="truncate w-full text-center">{file.name}</span>
                        </div>
                    )}

                    {/* Badge que indica que aún no está subido */}
                    <span className="absolute bottom-0 left-0 right-0 bg-brand/70 text-white text-[9px] text-center py-0.5">
                        Por subir
                    </span>

                    {/* Acciones: reordenar + eliminar */}
                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                        <button
                            type="button"
                            className="w-7 h-7 bg-white rounded-full text-black text-xs shadow"
                        >
                            ↔️
                        </button>
                        <button
                            type="button"
                            onClick={() => removeNew(i)}
                            className="w-7 h-7 bg-white rounded-full text-black text-xs shadow"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}

            {/*  Botón para agregar más archivos (se oculta al llegar al límite)*/}
            {canAddMore && (
                <div
                    onClick={() => !isLoading && inputRef.current.click()}
                    className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer bg-background"
                >
                    {isLoading ? (
                        <InfinityLoader
                            size="28"
                            stroke="4"
                            strokeLength="0.15"
                            bgOpacity="0.1"
                            speed="1.3"
                            color="black"
                        />
                    ) : (
                        <span className="text-text-primary text-sm font-bold text-center">
                            Subir
                            <CloudUpload className="place-self-center mx-auto mt-1" />
                        </span>
                    )}
                </div>
            )}

            {/* Input oculto */}
            <input
                ref={inputRef}
                type="file"
                hidden
                multiple
                accept={accept}
                onChange={(e) => handleFiles(e.target.files)}
            />
        </div>
    )
}
