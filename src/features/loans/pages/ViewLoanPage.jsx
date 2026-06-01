import { ViewDetailCard, Button } from "@/shared/";
import { ClipboardList } from "lucide-react";
import { loans } from "../data/loans";
import { useNavigate, useParams } from "react-router-dom";
import LoanMaterialsTable from "../components/LoanMaterialsTable";

export default function ViewLoanPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const loan = loans.find(l => l.id === Number(id));

    if (!loan) return <p>Préstamo no encontrado</p>;

    const handleEdit = () => {
        navigate(`/dashboard/loans/${loan.id}/edit`);
    };

    return (
        <div className="flex flex-col place-items-center justify-items-center gap-6 w-full">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full place-self-center">

                {/* Encabezado */}
                <div className="flex md:items-start flex-col md:flex-row md:justify-between place-items-center mb-6">
                    <div className="max-w-max">
                        <h3 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                            <ClipboardList className="text-brand" />
                            Visualizar préstamo
                        </h3>
                        <div className="h-0.5 bg-gradiant-title-line"></div>
                    </div>

                    <Button variant="warning" size="sm" onClick={handleEdit}>
                        Editar
                    </Button>
                </div>

                {/* Layout dos columnas */}
                <div className="grid grid-cols-[auto_1fr] gap-6 items-start">

                    {/* Izquierda: detalles del préstamo */}
                    <ViewDetailCard fields={[
                        { label: "ID préstamo",         value: loan.idLoan },
                        { label: "Fecha de salida",     value: loan.loanDateOut },
                        { label: "Usuario solicitante", value: loan.loanUserRequester },
                        { label: "Usuario prestador",   value: loan.loanUserLender },
                        { label: "Estado préstamo",     value: loan.loanStatus },
                        { label: "Tipo de préstamo",    value: loan.loanType },
                        { label: "Grupo aprendices",    value: String(loan.loanStudentsGroup) },
                    ]} />
                    {/* Derecha: tabla de materiales */}
                    <LoanMaterialsTable materialsString={loan.loanAssocietedMaterials} />

                </div>
            </div>
        </div>
    );
}
