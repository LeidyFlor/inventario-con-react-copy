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

/**
 * Recorta con puntos suspensivos y deja el texto completo en el tooltip.
 *
 * Distinto de TruncatedCell: ese cambia el texto por un enlace "Ver info." con
 * modal, que va bien para la justificación pero es incómodo para un nombre o
 * un correo, donde casi siempre alcanza con leer el principio.
 *
 * El ancho va en el <span> y no en el <td> porque la tabla usa min-w-max para
 * poder desbordar; un max-w en la celda lo pelearía.
 */
function EllipsisCell({ value, className = "max-w-40" }) {
    if (!value) return <span>—</span>;
    return (
        <span className={`block truncate ${className}`} title={value}>
            {value}
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
    // {
    //     accessorKey: "loanDateIn",
    //     header: "Fecha entrada",
    //     cell: ({ getValue }) => {
    //         const value = getValue();
    //         if (!value) return "";
    //         return new Date(value).toLocaleDateString("es-CO", {
    //             day:   "2-digit",
    //             month: "2-digit",
    //             year:  "numeric",
    //         });
    //     },
    // },

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

    // Columna usuario solicitante — puede traer un nombre o un correo largo
    // cuando la persona no está registrada, así que se recorta
    {
        accessorKey: "loanUserRequester",
        header: "Usuario solicitante",
        cell: ({ getValue }) => <EllipsisCell value={getValue()} />,
    },

    // Con qué se identifica al solicitante: su documento si está registrado,
    // o el correo que se escribió al crear el préstamo si no lo está. El
    // backend ya resuelve cuál de los dos mandar en requesterDocument.
    {
        accessorKey: "requesterDocument",
        header: "Documento / Correo",
        cell: ({ getValue }) => <EllipsisCell value={getValue()} />,
    },

    // Columna justificación — usa TruncatedCell para no romper el layout
    {
        accessorKey: "loanJustification",
        header: "Justificación de uso",
        cell: ({ getValue }) => <TruncatedCell value={getValue()} maxChars={30} />,
    },

    // Columna usuario prestador
    // {
    //     accessorKey: "loanUserLender",
    //     header: "Usuario prestador",
    // },

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
