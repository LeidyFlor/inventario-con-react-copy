import DataTable from "@/shared/components/DataTable"
import { loansColumns } from "../table/loansColumns"
import { loans } from "../data/loans"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import ReportConfigModal from "../reports/components/ReportLoanModal"


export default function ListLoanPage() {

    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  return (      
    
    <div className="p-4">
        <div className="flex justify-between "> 
              {/* contenenedor del titulo y la linea */}
              <div className=" mb-6 max-w-max">
                  <h1 className="flex content-center  gap-2 text-gradient-title text-h3 pb-0.5">
                      <ClipboardList className="text-brand" />
                      Listar préstamos
                  </h1>{/*linea degradada del titulo*/}
                  <div className="h-0.5 bg-gradiant-title-line"></div>

              </div>

            <div className="flex gap-6">

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        Reporte
                    </Button>
                <Link to="/dashboard/loan-create">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear préstamo
                    </Button>
                </Link>

            </div>

        </div>

        <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
        
        />
    

        <DataTable
            data={loans}
            columns={loansColumns}
        />

    </div>


  )
}
