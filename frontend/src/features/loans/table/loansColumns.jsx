// @refresh reset
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusSwitch, Modal } from "@/shared/";
import LoanRowActions from "../components/LoanRowActions";

// Componente separado para poder usar el hook useNavigate
// (los hooks no se pueden llamar dentro de la función cell directamente)
function LoanCodeCell({ loan }) {
    const navigate = useNavigate();
    return (
        <span
            onDoubleClick={() => navigate(`/dashboard/loans/${loan.id}/view`)}
            className="cursor-pointer hover:underline"
        >
            {loan.idLoan}
        </span>
    );
}

function TruncatedCell({ value, maxChars = 30 }) {
    const [open, setOpen] = useState(false);

    if (!value || value.length <= maxChars) {
        return <span>{value}</span>;
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-text-primary underline hover:opacity-70 transition-opacity"
            >
                Ver info.
            </button>

            {open && (
                <Modal
                    title="Justificación de uso"
                    size="sm"
                    cancelLabel="Cerrar"
                    onClose={() => setOpen(false)}
                >
                    <p className="text-body text-text-primary">{value}</p>
                </Modal>
            )}
        </>
    );
}

export const loansColumns = [

    // Columna ID préstamo — doble clic navega al visualizar del préstamo
    {
        accessorKey: "idLoan",
        header: "ID Préstamo",
        cell: ({ row }) => <LoanCodeCell loan={row.original} />,
    },

    // Columna grupo aprendices
    {
        accessorKey: "loanStudentsGroup",
        header: "Grupo aprendices",
    },

    // Columna fecha entrada — convierte ISO → DD/MM/YYYY
    {
        accessorKey: "loanDateIn",
        header: "Fecha entrada",
        cell: ({ getValue }) => {
            const value = getValue();
            if (!value) return "";
            return new Date(value).toLocaleDateString("es-CO", {
                day:   "2-digit",
                month: "2-digit",
                year:  "numeric",
            });
        },
    },

    // Columna fecha salida — convierte ISO → DD/MM/YYYY
    {
        accessorKey: "loanDateOut",
        header: "Fecha salida",
        cell: ({ getValue }) => {
            const value = getValue();
            if (!value) return "";
            return new Date(value).toLocaleDateString("es-CO", {
                day:   "2-digit",
                month: "2-digit",
                year:  "numeric",
            });
        },
    },

    // Columna usuario solicitante
    {
        accessorKey: "loanUserRequester",
        header: "Usuario solicitante",
    },

    // Columna justificación — usa TruncatedCell para no romper el layout
    {
        accessorKey: "loanJustification",
        header: "Justificación de uso",
        cell: ({ getValue }) => <TruncatedCell value={getValue()} maxChars={30} />,
    },

    // Columna usuario prestador
    {
        accessorKey: "loanUserLender",
        header: "Usuario prestador",
    },

    // Columna estado del préstamo
    {
        accessorKey: "loanStatus",
        header: "Estado",
    },

    // Columna tipo de préstamo (Interno / Externo)
    {
        accessorKey: "loanType",
        header: "Tipo de préstamo",
    },

    // Columna acciones (Visualizar, Retornar, Aprobar)
    {
        id: "actions",
        cell: ({ row }) => <LoanRowActions loan={row.original} />,
    },
];
