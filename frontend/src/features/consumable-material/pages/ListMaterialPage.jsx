import DataTable from "@/shared/components/DataTable"
import { getMaterialsColumns } from "../table/materialsColumns"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import { ReportConfigModal } from "../reports/components/ReportConfigModal"
import { useMaterials } from "../hooks/useMaterials"
import { Ping } from 'ldrs/react'
import 'ldrs/react/Ping.css'
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM, SCREEN_PERMS } from "@/features/permissions/config/perms"

export default function ListMaterialPage() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const { materials, setMaterials, loading } = useMaterials()
    const { hasPerm, hasAllPerms } = usePermissions()

  return (      
    
    <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between "> 
              {/* contenenedor del titulo y la linea */}
              <div className=" mb-6 max-w-max">
                  <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                      <ClipboardList className="text-brand" />
                      Listar Materiales de Consumo
                  </h1>{/*linea degradada del titulo*/}
                  <div className="h-0.5 bg-gradiant-title-line"></div>

              </div>

            <div className="flex mb-3 md:mb-0 gap-6">

                    {/* Reporte — requiere permiso de generar reporte */}
                    {hasPerm(PERM.CONSUMABLE_REPORT) && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        Reporte
                    </Button>
                    )}

                {/* Crear — requiere permiso de crear material de consumo */}
                {hasAllPerms(SCREEN_PERMS.CONSUMABLE_CREATE) && (
                <Link to="/dashboard/consumable-material-create">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear Material de consumo
                    </Button>
                </Link>
                )}

            </div>

        </div>
    

        {loading ? (
            <div className="flex flex-col place-items-center gap-2">
                <Ping
                    size="45"
                    speed="1.5"
                    color="#56B526"
                />
                <p className="text-text-muted text-center">Cargando materiales</p>

            </div>
        ) : (
            <DataTable
                data={materials}
                columns={getMaterialsColumns(setMaterials)}
            />
        )}
        <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
        />

    </div>


  )
}
