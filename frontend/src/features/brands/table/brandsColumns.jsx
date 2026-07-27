import { useState } from "react"
import { StatusSwitch, Alert } from "@/shared/"
import BrandRowAction from "../components/BrandRowAction"
import { toggleBrandStatus } from "../services/brandService"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

// Componente separado para poder usar el hook usePermissions
// (los hooks no se pueden llamar dentro de la función cell directamente)
function BrandStatusCell({ brand, setBrands }) {
    const { hasPerm } = usePermissions()

    const handleChange = async (newValue) => {
        if (!newValue) {
            const result = await Alert.confirm(
                "¿Desactivar marca?",
                `La marca "${brand.name}" quedará inactiva.`
            )
            if (!result.isConfirmed) {
                setBrands(prev => [...prev])
                return
            }
        }

        try {
            await toggleBrandStatus(brand.id, newValue)
            setBrands(prev =>
                prev.map(b => b.id === brand.id ? { ...b, is_active: newValue } : b)
            )
        } catch {
            Alert.error("Error", "No se pudo cambiar el estado de la marca")
        }
    }

    // Sin permiso para activar/desactivar solo se muestra el estado como texto
    if (!hasPerm(PERM.BRAND_DELETE)) {
        return (
            <span className={brand.is_active ? "text-brand" : "text-text-muted"}>
                {brand.is_active ? "Activo" : "Inactivo"}
            </span>
        )
    }

    return (
        <StatusSwitch
            checked={brand.is_active}
            onChange={handleChange}
            className="inline-flex"
        />
    )
}

export const getBrandsColumns = (setBrands) => [

    {
        accessorKey: "name",
        header: "Nombre",
    },

    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => <BrandStatusCell brand={row.original} setBrands={setBrands} />,
    },

    {
        id: "actions",
        cell: ({ row }) => (
            <BrandRowAction
                brand={row.original}
                onUpdated={(updated) =>
                    setBrands(prev =>
                        prev.map(b => b.id === updated.id ? updated : b)
                    )
                }
            />
        ),
    },
]
