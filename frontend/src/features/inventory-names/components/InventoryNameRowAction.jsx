import { Pencil } from "lucide-react"
import { useState } from "react"
import InventoryNameEditForm from "./InventoryNameEditForm"
import { IconButtonReal } from "@/shared"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function InventoryNameRowAction({ inventoryName, onUpdated }) {
    const [modalAbierto, setModalAbierto] = useState(false)
    const { hasPerm } = usePermissions()

    return (
        <div className="flex gap-2 mx-auto">
            {/* Botón editar — requiere permiso de actualizar inventarios */}
            {hasPerm(PERM.INVENTORY_NAME_CHANGE) && (
                <IconButtonReal onClick={() => setModalAbierto(true)} variant="outline">
                    <Pencil size={20} />
                </IconButtonReal>
            )}

            {/* El overlay lo pone el propio Modal compartido */}
            {modalAbierto && (
                <InventoryNameEditForm
                    inventoryName={inventoryName}
                    onClose={() => setModalAbierto(false)}
                    onUpdated={(actualizado) => {
                        onUpdated(actualizado)
                        setModalAbierto(false)
                    }}
                />
            )}
        </div>
    )
}
