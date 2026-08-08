import {  Trash2, Eye, Unlink } from "lucide-react"
import { IconButtonReal, Alert } from "@/shared"
import { deleteQuotation, unlinkQuotationMaterials } from "../services/quotationService"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

/**
 * Abre el PDF en una pestaña nueva.
 *
 * noopener,noreferrer es obligatorio: sin ellos la pestaña abierta puede
 * manipular la que la abrió a través de window.opener.
 */
export function abrirCotizacion(url) {
    window.open(url, "_blank", "noopener,noreferrer")
}

// Componente separado para poder usar el hook usePermissions
// (los hooks no se pueden llamar dentro de la función cell directamente)
function QuotationActionsCell({ quotation, setQuotations }) {
    const { hasPerm } = usePermissions()

    const handleDelete = async () => {
        // El backend rechaza el borrado si está en uso, pero avisarlo aquí
        // ahorra el intento y explica mejor
        const enUso = quotation.materials_count ?? 0
        if (enUso > 0) {
            Alert.error(
                "No se puede eliminar",
                `Hay ${enUso} material(es) enlazados a "${quotation.file_name}". ` +
                `Quítala de esos materiales antes de borrarla.`
            )
            return
        }

        const result = await Alert.confirm(
            "¿Eliminar cotización?",
            `"${quotation.file_name}" se borrará de forma definitiva, junto con el archivo. Esta acción no se puede deshacer.`
        )
        if (!result.isConfirmed) return

        try {
            await deleteQuotation(quotation.id)
            setQuotations(prev => prev.filter(q => q.id !== quotation.id))
            Alert.success("Cotización eliminada", "El archivo fue borrado correctamente.")
        } catch (err) {
            Alert.error("Error", err.message)
        }
    }

    const handleUnlink = async () => {
        const enUso = quotation.materials_count ?? 0
        if (enUso === 0) {
            Alert.error(
                "Nada que desenlazar",
                `"${quotation.file_name}" no está enlazada a ningún material.`
            )
            return
        }

        // Los materiales que solo tenían esta cotización quedan en cero, por
        // debajo del mínimo de 1. Se avisa antes de confirmar.
        const result = await Alert.confirm(
            "¿Desenlazar de todos los materiales?",
            `"${quotation.file_name}" se quitará de ${enUso} material(es). ` +
            `Los que no tengan otra cotización quedarán sin ninguna, y habrá ` +
            `que asignarles una al editarlos. Después podrás eliminarla.`
        )
        if (!result.isConfirmed) return

        try {
            const res = await unlinkQuotationMaterials(quotation.id)
            setQuotations(prev =>
                prev.map(q => q.id === quotation.id ? { ...q, materials_count: 0 } : q)
            )
            Alert.success(
                "Cotización desenlazada",
                res.left_without > 0
                    ? `${res.message} ${res.left_without} quedaron sin ninguna cotización.`
                    : res.message
            )
        } catch (err) {
            Alert.error("Error", err.message)
        }
    }

    return (
        <div className="flex gap-2 mx-auto">
            <IconButtonReal
                variant="outline"
                onClick={() => abrirCotizacion(quotation.file_url)}
                ariaLabel={`Abrir ${quotation.file_name}`}
            >
                <Eye size={20} />
            </IconButtonReal>

            {/* Desenlazar usa el permiso de cambio, no el de borrado: modifica
                los materiales, no elimina la cotización */}
            {hasPerm(PERM.QUOTATION_CHANGE) && (
                <IconButtonReal
                    variant="outline"
                    onClick={handleUnlink}
                    ariaLabel={`Desenlazar ${quotation.file_name} de todos los materiales`}
                >
                    <Unlink size={20} />
                </IconButtonReal>
            )}

            {hasPerm(PERM.QUOTATION_DELETE) && (
                <IconButtonReal
                    variant="outline"
                    onClick={handleDelete}
                    ariaLabel={`Eliminar ${quotation.file_name}`}
                >
                    <Trash2 size={20} />
                </IconButtonReal>
            )}
        </div>
    )
}

export const getQuotationsColumns = (setQuotations) => [

    {
        accessorKey: "file_name",
        header: "Archivo",
    },

    {
        accessorKey: "uploaded_at",
        header: "Fecha de subida",
        cell: ({ row }) => {
            const fecha = row.original.uploaded_at
            return fecha ? new Date(fecha).toLocaleDateString("es-CO") : "—"
        },
    },

    {
        accessorKey: "materials_count",
        header: "Materiales",
        cell: ({ row }) => row.original.materials_count ?? 0,
    },

    {
        id: "actions",
        cell: ({ row }) => (
            <QuotationActionsCell quotation={row.original} setQuotations={setQuotations} />
        ),
    },
]
