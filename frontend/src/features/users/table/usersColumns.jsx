//src/features/users/table/userColumns.js
import { useState } from "react"
import { StatusSwitch } from "@/shared/";
import UserRowActions from "../components/UserRowActions";
import { Alert } from "@/shared"
import { toggleUserStatus } from "../services/userService"

// Muestra los grupos como tags; si hay más de 1 los colapsa
function GroupsTags({ groups }) {
    const [expanded, setExpanded] = useState(false)
    if (!groups || groups.length === 0) return <span className="text-text-muted text-small">Sin grupo</span>
    if (groups.length !== 0) return <span className="bg-brand-soft text-brand text-small px-2 py-0.5 rounded-full">{groups[0].name}</span>

    const visible = expanded ? groups : [groups[0]]
    return (
        <div className="flex flex-wrap gap-1">
            {visible.map(g => (
                <span key={g.id} className="bg-brand-soft text-brand text-small px-2 py-0.5 rounded-full">{g.name}</span>
            ))}
            <button
                onClick={() => setExpanded(prev => !prev)}
                className="text-small text-text-muted underline cursor-pointer"
            >
                {expanded ? "ver menos" : `+${groups.length - 1} más`}
            </button>
        </div>
    )
}

// Recibe setUsers para actualizar la lista localmente sin recargar. navigate viene del padre
export const getUsersColumns = (setUsers, navigate) => [
    // Columna Nombre (combina first_name + last_name del backend)
    {
        id: "userName",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        header: "Nombre",
        cell: ({ row }) => (
            <span
                onDoubleClick={() => navigate(`/dashboard/users/${row.original.id}/view`)}
                className="cursor-pointer hover:underline"
            >
                {row.original.first_name} {row.original.last_name}
            </span>
        )
    },

    // Columna Tipo de usuario — muestra todos los grupos con expand
    {
        id: "userType",
        header: "Tipo de usuario",
        cell: ({ row }) => <GroupsTags groups={row.original.groups} />,
    },

    // Columna Número de documento
    {
        accessorKey: "user_document",
        header: "Número de documento",
    },

    // Columna Email
    {
        accessorKey: "email",
        header: "Email",
    },

    // Columna Teléfono
    {
        accessorKey: "user_tel",
        header: "Teléfono",
    },


    // Columna Estado (activo / inactivo)
    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => {
            const user = row.original;

            const handleChange = async (newValue) => {
                // Si va a desactivar, pedir confirmación
                if (!newValue) {
                    const result = await Alert.confirm(
                        "¿Desactivar usuario?",
                        `${user.first_name} ${user.last_name} no podrá iniciar sesión.`
                    )
                    if (!result.isConfirmed) {
                        setUsers(prev => [...prev])
                        return
                    }
                }

                try {
                    await toggleUserStatus(user.id, newValue)
                    // Actualiza el estado local sin recargar toda la lista
                    setUsers(prev =>
                        prev.map(u => u.id === user.id ? { ...u, is_active: newValue } : u)
                    )
                } catch {
                    Alert.error("Error", "No se pudo actualizar el estado del usuario")
                }
            }

            return (
                <StatusSwitch
                    checked={user.is_active}
                    onChange={handleChange}
                    className="inline-flex"
                />
            )
        },
    },


    // Columna de acciones (editar / eliminar)
    {
        id: "actions", // No usa accessorKey porque no corresponde a un campo del usuario


        // Renderiza el componente de acciones pasando el usuario completo
        cell: ({ row }) => <UserRowActions user={row.original} />,
    },
];
