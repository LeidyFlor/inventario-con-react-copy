// import { useState } from "react"
// @refresh reset
import { StatusSwitch, Alert } from "@/shared/"
import GroupRowAction from "../components/GroupRowAction"
import { toggleGroupStatus } from "../services/groupService"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

// Componente separado para poder usar el hook usePermissions
// (los hooks no se pueden llamar dentro de la función cell directamente)
function GroupStatusCell({ group, setGroups }) {
    const { hasPerm } = usePermissions()

    const handleChange = async (newValue) => {
        if (!newValue) {
            const result = await Alert.confirm(
                "¿Desactivar grupo?",
                `El grupo "${group.name}" quedará inactivo.`
            )
            if (!result.isConfirmed) {
                setGroups(prev => [...prev])
                return
            }
        }

        try {
            await toggleGroupStatus(group.id, newValue)
            setGroups(prev =>
                prev.map(g => g.id === group.id ? { ...g, is_active: newValue } : g)
            )
        } catch (err) {
            Alert.error("Error", err.message ?? "No se pudo cambiar el estado del grupo")
        }
    }

    // Sin permiso para desactivar grupos solo se muestra el estado como texto
    if (!hasPerm(PERM.GROUP_DELETE)) {
        return (
            <span className={group.is_active ? "text-brand" : "text-text-muted"}>
                {group.is_active ? "Activo" : "Inactivo"}
            </span>
        )
    }

    return (
        <StatusSwitch
            checked={group.is_active}
            onChange={handleChange}
            className="inline-flex"
        />
    )
}

export const getGroupsColumns = (setGroups) => [

    {
        accessorKey: "name",
        header: "Nombre",
    },

    {
        // Ayuda a entender por qué un grupo no se deja desactivar, y de paso
        // dice a cuántos afecta el botón de retirar usuarios
        accessorKey: "users_count",
        header: "Usuarios 🖇️",
        cell: ({ row }) => row.original.users_count ?? 0,
    },

    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => <GroupStatusCell group={row.original} setGroups={setGroups} />,
    },

    {
        id: "actions",
        cell: ({ row }) => (
            <GroupRowAction
                group={row.original}
                onUpdated={(updated) =>
                    setGroups(prev =>
                        prev.map(g => g.id === updated.id ? updated : g)
                    )
                }
            />
        ),
    },
]
