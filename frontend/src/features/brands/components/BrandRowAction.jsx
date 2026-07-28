import { Pencil } from "lucide-react"
import { useState } from "react"
import BrandEditForm from "./BrandEditForm"
import { IconButtonReal } from "@/shared"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function BrandRowAction({ brand, onUpdated }) {
    const [modalAbierto, setModalAbierto] = useState(false)
    const { hasPerm } = usePermissions()

    return (
        <div className="flex gap-2 mx-auto">
            {/* Botón editar — requiere permiso de actualizar marcas */}
            {hasPerm(PERM.BRAND_CHANGE) && (
            <IconButtonReal onClick={() => setModalAbierto(true)} variant="outline">
                <Pencil size={20} />
            </IconButtonReal>
            )}

            {modalAbierto && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setModalAbierto(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <BrandEditForm
                            brand={brand}
                            onClose={() => setModalAbierto(false)}
                            onUpdated={(updated) => {
                                onUpdated(updated)
                                setModalAbierto(false)
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
