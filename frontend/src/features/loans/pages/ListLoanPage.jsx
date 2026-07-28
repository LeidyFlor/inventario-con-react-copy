import DataTable from "@/shared/components/DataTable"
import { loansColumns } from "../table/loansColumns"
import LoanRowActions from "../components/LoanRowActions"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { useState, useEffect } from "react"
import ReportConfigModal from "../reports/components/ReportLoanModal"
import { getLoans } from "../services/loanService"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

export default function ListLoanPage() {
    const [loanList, setLoanList]   = useState([])
    const [loading, setLoading]     = useState(true)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const { hasPerm } = usePermissions()

    useEffect(() => {
        getLoans()
            .then(setLoanList)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2 mt-20">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando préstamos...</p>
        </div>
    )

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
    
    <div className="p-2">
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

                    {/* Reporte — requiere permiso de generar reporte de préstamos */}
                    {hasPerm(PERM.LOAN_REPORT) && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        Reporte
                    </Button>
                    )}
                {/* Crear préstamo — requiere permiso de crear préstamos */}
                {hasPerm(PERM.LOAN_ADD) && (
                <Link to="/dashboard/loan-create">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear préstamo
                    </Button>
                </Link>
                )}

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
