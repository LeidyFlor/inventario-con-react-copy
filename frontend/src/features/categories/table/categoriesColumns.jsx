import { StatusSwitch, Alert } from "@/shared/"
import CategoryRowAction from "../components/CategoryRowAction"
import { toggleCategoryStatus } from "../services/categoryService"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

// Componente separado para poder usar el hook usePermissions
// (los hooks no se pueden llamar dentro de la función cell directamente)
function CategoryStatusCell({ category, setCategories }) {
    const { hasPerm } = usePermissions()

    const handleChange = async (newValue) => {
        if (!newValue) {
            // Desactivar no rompe nada: los materiales que ya la tienen la
            // conservan. Aun así se avisa a cuántos afecta, porque para
            // editarlos habrá que elegirles otra categoría.
            const enUso = category.materials_count ?? 0
            const detalle = enUso > 0
                ? ` Hay ${enUso} material(es) con esta categoría: la conservan, y al editarlos aparecerá marcada como inactiva.`
                : ""

            const result = await Alert.confirm(
                "¿Desactivar categoría?",
                `"${category.name}" dejará de aparecer al registrar materiales.${detalle}`
            )
            if (!result.isConfirmed) {
                setCategories(prev => [...prev])
                return
            }
        }

        try {
            await toggleCategoryStatus(category.id, newValue)
            setCategories(prev =>
                prev.map(c => c.id === category.id ? { ...c, is_active: newValue } : c)
            )
        } catch {
            Alert.error("Error", "No se pudo cambiar el estado de la categoría")
        }
    }

    // Sin permiso para activar/desactivar solo se muestra el estado como texto
    if (!hasPerm(PERM.CATEGORY_DELETE)) {
        return (
            <span className={category.is_active ? "text-brand" : "text-text-muted"}>
                {category.is_active ? "Activo" : "Inactivo"}
            </span>
        )
    }

    return (
        <StatusSwitch
            checked={category.is_active}
            onChange={handleChange}
            className="inline-flex"
        />
    )
}

export const getCategoriesColumns = (setCategories) => [

    {
        accessorKey: "name",
        header: "Nombre",
    },

    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => (
            <CategoryStatusCell category={row.original} setCategories={setCategories} />
        ),
    },

    {
        id: "actions",
        cell: ({ row }) => (
            <CategoryRowAction
                category={row.original}
                onUpdated={(actualizada) =>
                    setCategories(prev =>
                        prev.map(c => c.id === actualizada.id ? actualizada : c)
                    )
                }
            />
        ),
    },
]
