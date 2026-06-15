import DataTable from "@/shared/components/DataTable"
import { loansColumns } from "../table/loansColumns"
import LoanRowActions from "../components/LoanRowActions"
import { loans } from "../data/loans"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { useState } from "react"
import ReportConfigModal from "../reports/components/ReportLoanModal"

export default function ListLoanPage() {
    const [loanList, setLoanList] = useState(loans)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    const handleRemoveLoan = (loanId) => {
        setLoanList((prev) => prev.filter((item) => item.id !== loanId))
    }

    const columns = [
        ...loansColumns.slice(0, -1),
        {
            id: "actions",
            cell: ({ row }) => (
                <LoanRowActions loan={row.original} />
            ),
        },
    ]

  return (      
    
    <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between ">
              {/* contenenedor del titulo y la linea */}
              <div className=" mb-6 max-w-max">
                  <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                      <ClipboardList className="text-brand" />
                      Listar préstamos
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

        <DataTable
            data={loanList}
            columns={columns}
        />
        <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
        
        />
    
    </div>
  )
}
