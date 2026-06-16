import DataTable from "@/shared/components/DataTable"
import { usersColumns } from "../table/usersColumns"
import { users } from "../data/users"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { ReportConfigModal } from "../reports/components/ReportConfigModal";
import { useState } from "react"

export default function ListUserPage() {
    //Estado para el boton, si se clikea o no el boton de reporte
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
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
    

        <DataTable
            data={users}
            columns={usersColumns}
        />

        <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
        />

    </div>


  )
}
