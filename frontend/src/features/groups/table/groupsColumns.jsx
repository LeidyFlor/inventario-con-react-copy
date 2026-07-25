// import { useState } from "react"
import { StatusSwitch, Alert } from "@/shared/"
import GroupRowAction from "../components/GroupRowAction"
import { toggleGroupStatus } from "../services/groupService"

export const getGroupsColumns = (setGroups) => [

    {
        accessorKey: "name",
        header: "Nombre",
    },

    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => {
            const group = row.original

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

            return (
                <StatusSwitch
                    checked={group.is_active}
                    onChange={handleChange}
                    className="inline-flex"
                />
            )
        },
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
