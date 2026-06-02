import DataTable from "@/shared/components/DataTable"
import { materialsColumns } from "../table/materialsColumns"
import { materials } from "../data/materials"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import { CreateConsumablePage, EditConsumablePage } from "@/features/consumable-material";
import { ReportConfigModal } from "../reports/components/ReportConfigModal";


export default function ListMaterialPage() {
 //Estado para el boton, si se clikea o no el boton de reporte
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

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


                
                    <Button
                        variant="secondary" 
                        size="sm"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        Reporte
                    </Button>

                <Link to="/dashboard/consumable-material-create">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear Material de consumo
                    </Button>
                </Link>

            </div>

        </div>
    

        <DataTable
            data={materials}
            columns={materialsColumns}
        />
        <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
        />

    </div>


  )
}
