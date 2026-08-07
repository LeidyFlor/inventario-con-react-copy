import { useState, useEffect } from "react"
import DataTable from "@/shared/components/DataTable"
import { getCategoriesColumns } from "../table/categoriesColumns"
import { Button, Alert } from "@/shared/"
import { Layers } from "lucide-react"
import CategoryRegisterForm from "../components/CategoryRegisterForm"
import { getCategories } from "../services/categoryService"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function ListCategoryPage() {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const { hasPerm } = usePermissions()

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => Alert.error("Error", "No se pudieron cargar las categorías"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando categorías...</p>
        </div>
    )

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between">
                <div className="mb-2 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Layers className="text-brand" />
                        Listar categorías
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex gap-6">
                    {hasPerm(PERM.CATEGORY_ADD) && (
                        <Button variant="primary" size="sm" onClick={() => setModalAbierto(true)}>
                            Crear categoría
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                data={categories}
                columns={getCategoriesColumns(setCategories)}
            />

            {/* El overlay lo pone el propio Modal compartido */}
            {modalAbierto && (
                <CategoryRegisterForm
                    onClose={() => setModalAbierto(false)}
                    onCreated={(nueva) => setCategories(prev => [...prev, nueva])}
                />
            )}
        </div>
    )
}
