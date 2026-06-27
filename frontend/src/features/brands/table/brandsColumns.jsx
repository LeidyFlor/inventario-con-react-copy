import { useState } from "react"
import { StatusSwitch, Alert } from "@/shared/"
import BrandRowAction from "../components/BrandRowAction"
import { toggleBrandStatus } from "../services/brandService"

export const getBrandsColumns = (setBrands) => [

    {
        accessorKey: "name",
        header: "Nombre",
    },

    {
        accessorKey: "is_active",
        header: "Estado",
        cell: ({ row }) => {
            const brand = row.original

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

            return (
                <StatusSwitch
                    checked={brand.is_active}
                    onChange={handleChange}
                    className="inline-flex"
                />
            )
        },
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
