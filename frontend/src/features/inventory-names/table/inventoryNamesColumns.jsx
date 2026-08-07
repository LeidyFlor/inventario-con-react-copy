import { StatusSwitch, Alert } from "@/shared/"
import InventoryNameRowAction from "../components/InventoryNameRowAction"
import { toggleInventoryNameStatus } from "../services/inventoryNameService"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

// Componente separado para poder usar el hook usePermissions
// (los hooks no se pueden llamar dentro de la función cell directamente)
function InventoryNameStatusCell({ inventoryName, setInventoryNames }) {
    const { hasPerm } = usePermissions()

    const handleChange = async (newValue) => {
        if (!newValue) {
            // Desactivar no rompe nada: los materiales que ya lo tienen lo
            // conservan. Aun así se avisa a cuántos afecta, porque para
            // editarlos habrá que elegirles otro inventario.
            const enUso = inventoryName.materials_count ?? 0
            const detalle = enUso > 0
                ? ` Hay ${enUso} material(es) con este inventario: lo conservan, y al editarlos aparecerá marcado como inactivo.`
                : ""

            const result = await Alert.confirm(
                "¿Desactivar inventario?",
                `"${inventoryName.name}" dejará de aparecer al registrar materiales.${detalle}`
            )
            if (!result.isConfirmed) {
                setInventoryNames(prev => [...prev])
                return
            }
        }

        try {
            await toggleInventoryNameStatus(inventoryName.id, newValue)
            setInventoryNames(prev =>
                prev.map(i => i.id === inventoryName.id ? { ...i, is_active: newValue } : i)
            )
        } catch {
            Alert.error("Error", "No se pudo cambiar el estado del inventario")
        }
    }

    // Sin permiso para activar/desactivar solo se muestra el estado como texto
    if (!hasPerm(PERM.INVENTORY_NAME_DELETE)) {
        return (
            <span className={inventoryName.is_active ? "text-brand" : "text-text-muted"}>
                {inventoryName.is_active ? "Activo" : "Inactivo"}
            </span>
        )
    }

    return (
        <StatusSwitch
            checked={inventoryName.is_active}
            onChange={handleChange}
            className="inline-flex"
        />
    )
}

export const getInventoryNamesColumns = (setInventoryNames) => [

    {
        accessorKey: "name",
        header: "Nombre",
    },

    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => (
            <InventoryNameStatusCell
                inventoryName={row.original}
                setInventoryNames={setInventoryNames}
            />
        ),
    },

    {
        id: "actions",
        cell: ({ row }) => (
            <InventoryNameRowAction
                inventoryName={row.original}
                onUpdated={(actualizado) =>
                    setInventoryNames(prev =>
                        prev.map(i => i.id === actualizado.id ? actualizado : i)
                    )
                }
            />
        ),
    },
]
