import { useState, useEffect } from "react"
import DataTable from "@/shared/components/DataTable"
import { getQuotationsColumns } from "../table/quotationsColumns"
import { Button, Alert } from "@/shared/"
import { FileStack } from "lucide-react"
import QuotationUploadForm from "../components/QuotationUploadForm"
import { getQuotations } from "../services/quotationService"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function ListQuotationPage() {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [quotations, setQuotations] = useState([])
    const [loading, setLoading] = useState(true)
    const { hasPerm } = usePermissions()

    useEffect(() => {
        getQuotations()
            .then(setQuotations)
            .catch(() => Alert.error("Error", "No se pudieron cargar las cotizaciones"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando cotizaciones...</p>
        </div>
    )

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between">
                <div className="mb-2 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <FileStack className="text-brand" />
                        Listar cotizaciones
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex gap-6">
                    {hasPerm(PERM.QUOTATION_ADD) && (
                        <Button variant="primary" size="sm" onClick={() => setModalAbierto(true)}>
                            Subir cotizaciones
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                data={quotations}
                columns={getQuotationsColumns(setQuotations)}
            />

            {/* El overlay lo pone el propio Modal compartido */}
            {modalAbierto && (
                <QuotationUploadForm
                    onClose={() => setModalAbierto(false)}
                    // Cada archivo subido es una cotización, así que llegan varias
                    onCreated={(nuevas) => setQuotations(prev => [...nuevas, ...prev])}
                />
            )}
        </div>
    )
}
