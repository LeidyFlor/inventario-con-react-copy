import { useState, useEffect } from "react"
import DataTable from "@/shared/components/DataTable"
import { getInventoryNamesColumns } from "../table/inventoryNamesColumns"
import { Button, Alert } from "@/shared/"
import { ShelvingUnit } from "lucide-react"
import InventoryNameRegisterForm from "../components/InventoryNameRegisterForm"
import { getInventoryNames } from "../services/inventoryNameService"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function ListInventoryNamePage() {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [inventoryNames, setInventoryNames] = useState([])
    const [loading, setLoading] = useState(true)
    const { hasPerm } = usePermissions()

    useEffect(() => {
        getInventoryNames()
            .then(setInventoryNames)
            .catch(() => Alert.error("Error", "No se pudieron cargar los inventarios"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando inventarios...</p>
        </div>
    )

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between">
                <div className="mb-2 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <ShelvingUnit className="text-brand" />
                        Listar nombres de inventario
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex gap-6">
                    {hasPerm(PERM.INVENTORY_NAME_ADD) && (
                        <Button variant="primary" size="sm" onClick={() => setModalAbierto(true)}>
                            Crear inventario
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                data={inventoryNames}
                columns={getInventoryNamesColumns(setInventoryNames)}
            />

            {/* El overlay lo pone el propio Modal compartido */}
            {modalAbierto && (
                <InventoryNameRegisterForm
                    onClose={() => setModalAbierto(false)}
                    onCreated={(nuevo) => setInventoryNames(prev => [...prev, nuevo])}
                />
            )}
        </div>
    )
}
