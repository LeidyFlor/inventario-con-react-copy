import { Pencil, Unlink } from "lucide-react"
import { useState } from "react"
import GroupEditModal from "./GroupEditModal"
import { IconButtonReal, Alert } from "@/shared"
import { unlinkGroupUsers } from "../services/groupService"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function GroupRowAction({ group, onUpdated }) {
    const [modalAbierto, setModalAbierto] = useState(false)
    const { hasPerm } = usePermissions()

    const handleUnlink = async () => {
        const enUso = group.users_count ?? 0
        if (enUso === 0) {
            Alert.error(
                "Nada que retirar",
                `El grupo "${group.name}" no tiene usuarios asignados.`
            )
            return
        }

        // Los usuarios que solo pertenecían a este grupo se quedan sin
        // ninguno, y pierden los permisos que heredaban de él
        const result = await Alert.confirm(
            "¿Retirar a todos los usuarios?",
            `Se sacará del grupo "${group.name}" a ${enUso} usuario(s). ` +
            `No se eliminan ni se desactivan, pero los que no tengan otro grupo ` +
            `se quedarán sin permisos heredados. Después podrás desactivar el grupo.`
        )
        if (!result.isConfirmed) return

        try {
            const res = await unlinkGroupUsers(group.id)
            onUpdated({ ...group, users_count: 0 })
            Alert.success(
                "Usuarios retirados",
                res.left_without > 0
                    ? `${res.message} ${res.left_without} quedaron sin ningún grupo.`
                    : res.message
            )
        } catch (err) {
            Alert.error("Error", err.message)
        }
    }

    return (
        <div className="flex gap-2 mx-auto">
            {/* Botón editar — requiere permiso de actualizar grupos */}
            {hasPerm(PERM.GROUP_CHANGE) && (
            <IconButtonReal onClick={() => setModalAbierto(true)} variant="outline">
                <Pencil size={20} />
            </IconButtonReal>
            )}

            {/* Retirar a todos los usuarios. Mismo permiso que editar: modifica
                a quién pertenece el grupo, no lo elimina. */}
            {hasPerm(PERM.GROUP_CHANGE) && (
            <IconButtonReal
                onClick={handleUnlink}
                variant="outline"
                ariaLabel={`Retirar todos los usuarios de ${group.name}`}
            >
                <Unlink size={20} />
            </IconButtonReal>
            )}

            {modalAbierto && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setModalAbierto(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GroupEditModal
                            group={group}
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
