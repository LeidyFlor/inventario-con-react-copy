import DataTable from "@/shared/components/DataTable"
import { getUsersColumns } from "../table/usersColumns"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { ReportConfigModal } from "../reports/components/ReportConfigModal";
import { useState } from "react"
import { useUsers } from "../hooks/useUsers"
import { Ping } from 'ldrs/react'
import 'ldrs/react/Ping.css'

export default function ListUserPage() {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const { users, setUsers, loading } = useUsers()

  return (      
    
    <div className="p-6">
        <div className="flex justify-between "> 
              {/* contenenedor del titulo y la linea */}
              <div className=" mb-6 max-w-max">
                  <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                      <ClipboardList className="text-brand" />
                      Listar usuarios
                  </h1>{/*linea degradada del titulo*/}
                  <div className="h-0.5 bg-gradiant-title-line"></div>

              </div>

            <div className="flex gap-6">

                    <Button
                        variant="secondary" 
                        size="sm"
                        onClick = {() => setIsReportModalOpen(true)}
                    >
                        Reporte
                    </Button>

                  <Link to="/dashboard/user-create">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear Usuario
                    </Button>
                </Link>

            </div>

        </div>
    
        {loading ? (
            <div className="flex flex-col place-items-center gap-2">
                <Ping
                    size="45"
                    speed="1.5"
                    color="#56B526"
                />
                <p className="text-text-muted text-center">Cargando usuarios</p>

            </div>
        ) : (
            <DataTable
                data={users}
                columns={getUsersColumns(setUsers)}
            />
        )}

        <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
        />

    </div>
  )
}
