import { Pencil } from "lucide-react"
import { useState } from "react"
import CategoryEditForm from "./CategoryEditForm"
import { IconButtonReal } from "@/shared"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function CategoryRowAction({ category, onUpdated }) {
    const [modalAbierto, setModalAbierto] = useState(false)
    const { hasPerm } = usePermissions()

    return (
        <div className="flex gap-2 mx-auto">
            {/* Botón editar — requiere permiso de actualizar categorías */}
            {hasPerm(PERM.CATEGORY_CHANGE) && (
                <IconButtonReal onClick={() => setModalAbierto(true)} variant="outline">
                    <Pencil size={20} />
                </IconButtonReal>
            )}

            {/* El overlay lo pone el propio Modal compartido */}
            {modalAbierto && (
                <CategoryEditForm
                    category={category}
                    onClose={() => setModalAbierto(false)}
                    onUpdated={(actualizada) => {
                        onUpdated(actualizada)
                        setModalAbierto(false)
                    }}
                />
            )}
        </div>
    )
}
