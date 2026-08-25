import { ViewDetailCard, Button } from "@/shared/";
import { ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoanMaterialsTable from "../components/LoanMaterialsTable";
import { getLoan } from "../services/loanService";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";

export default function ViewLoan() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loan, setLoan]       = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getLoan(id)
            .then(setLoan)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2 mt-20">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando préstamo...</p>
        </div>
    )
    if (!loan) return <p>Préstamo no encontrado</p>;

    const handleEdit = () => {
        navigate(`/dashboard/loans/${loan.id}/edit`);
    };

    // Formatea fecha ISO → "DD/MM/YYYY"
    const formatDate = (isoDate) => {
        if (!isoDate) return "—";
        return new Date(isoDate).toLocaleDateString("es-CO", {
            day:   "2-digit",
            month: "2-digit",
            year:  "numeric",
        });
    };

    // Si el texto es corto (menos de 20 caracteres) se muestra completo 
    // Estado independiente (useState local)
    // Si es largo se muestra truncado con opción de expandir
    function JustificationText({ value }) {
            const [expanded, setExpanded] = useState(false);
            const maxChars = 20;

            if (value.length <= maxChars) {
                return <span className="block max-w-[26ch] whitespace-pre-wrap wrap-break-word">{value}</span>;
            }

        return (
            <div className="space-y-1 max-w-[26ch]">
                <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {expanded ? value : `${value.slice(0, maxChars)}...`}
                </p>
                
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-small text-text-primary underline self-start hover:opacity-70 transition-opacity"
                >
                    {expanded ? "Ver menos" : "Ver más"}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col place-items-center justify-items-center gap-6 w-full">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full place-self-center">

                {/* Encabezado */}
                <div className="flex md:items-start flex-col md:flex-row md:justify-between place-items-center mb-6 gap-4 md:gap-0">
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
                <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 place-items-center lg:items-start">

                    {/* Izquierda: detalles del préstamo */}
                    <ViewDetailCard fields={[
                        { label: "ID préstamo",         value: loan.idLoan },
                        { label: "Fecha de salida",     value: formatDate(loan.loanDateOut) },
                        { label: "Fecha estimada de entrega",    value: formatDate(loan.loanDateIn) },
                        { label: "Usuario solicitante", value: loan.loanUserRequester },
                        { label: "Usuario prestador",   value: loan.loanUserLender },
                        { 
                            label: "Justificación", 
                            value: <JustificationText value={loan.loanJustification} /> 
                        },
                        { label: "Estado préstamo",     value: loan.loanStatusLabel },
                        { label: "Tipo de préstamo",    value: loan.loanType },
                        { label: "Grupo aprendices",    value: String(loan.loanStudentsGroup) },
                    ]} />

                    <div className="w-full max-w-full mx-auto lg:mx-0 lg:min-w-0 ">
                    {/* Derecha: tabla de materiales del préstamo */}
                    <LoanMaterialsTable materials={loan.loanMaterials} />
                    </div>
                </div>
            </div>
        </div>
    );
}
