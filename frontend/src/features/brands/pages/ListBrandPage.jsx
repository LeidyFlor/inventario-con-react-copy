import { useState, useEffect } from "react"
import DataTable from "@/shared/components/DataTable"
import { getBrandsColumns } from "../table/brandsColumns"
import { Button, Alert } from "@/shared/"
import { ClipboardList } from "lucide-react"
import BrandRegisterForm from "../components/BrandRegisterForm"
import { getBrands } from "../services/brandService"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function ListBrandPage() {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)
    const { hasPerm } = usePermissions()

    useEffect(() => {
        getBrands()
            .then(setBrands)
            .catch(() => Alert.error("Error", "No se pudieron cargar las marcas"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando marcas...</p>
        </div>
    )

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between">
                <div className="mb-2 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <ClipboardList className="text-brand" />
                        Listar marcas
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex gap-6">
                    {/* Crear marca — requiere permiso de crear marcas */}
                    {hasPerm(PERM.BRAND_ADD) && (
                    <Button variant="primary" size="sm" onClick={() => setModalAbierto(true)}>
                        Crear marca
                    </Button>
                    )}
                </div>
            </div>

            <DataTable
                data={brands}
                columns={getBrandsColumns(setBrands)}
            />

            {modalAbierto && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setModalAbierto(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <BrandRegisterForm
                            onClose={() => setModalAbierto(false)}
                            onCreated={(newBrand) => setBrands(prev => [...prev, newBrand])}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
