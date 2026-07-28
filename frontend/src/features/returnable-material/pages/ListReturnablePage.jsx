// src/features/returnable-material/pages/ListReturnablePage.jsx
import DataTable from "@/shared/components/DataTable"
import { getReturnableColumns } from "../table/ReturnableColumns"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import { ReportConfigModal } from "../reports/components/ReportConfigModal"
import { useReturnableMaterials } from "../hooks/useReturnableMaterials"
import { Ping } from 'ldrs/react'
import 'ldrs/react/Ping.css'
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function ListReturnablePage() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const { returnables, setReturnables, loading } = useReturnableMaterials()
    const { hasPerm } = usePermissions()

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between">
                {/* Título */}
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <ClipboardList className="text-brand" />
                        Listar Material Devolutivo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex mb-3 md:mb-0 gap-6">
                    {/* Reporte — requiere permiso de generar reporte */}
                    {hasPerm(PERM.RETURNABLE_REPORT) && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        Reporte
                    </Button>
                    )}
                    {/* Crear — requiere permiso de crear material devolutivo */}
                    {hasPerm(PERM.RETURNABLE_ADD) && (
                    <Link to="/dashboard/returnable-material-create">
                        <Button variant="primary" size="sm">
                            Crear Material devolutivo
                        </Button>
                    </Link>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col place-items-center gap-2">
                    <Ping size="45" speed="1.5" color="#56B526" />
                    <p className="text-text-muted text-center">Cargando materiales devolutivos</p>
                </div>
            ) : (
                <DataTable
                    data={returnables}
                    columns={getReturnableColumns(setReturnables)}
                />
            )}

            <ReportConfigModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    )
}
