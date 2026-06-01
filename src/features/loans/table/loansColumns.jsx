import { useState } from "react";
import { StatusSwitch } from "@/shared/";
import LoanRowActions from "../components/LoanRowActions";

// ==================================================
//   Celda con texto truncado + botón expandir/colapsar
// ==================================================
/*
    Cada instancia tiene su propio useState → el toggle
    de una fila no afecta a las demás.
    maxChars: cantidad de caracteres visibles antes del "..."
*/
function TruncatedCell({ value, maxChars = 30 }) {
    const [expanded, setExpanded] = useState(false);

    // Si el texto cabe completo, se muestra sin botón
    if (!value || value.length <= maxChars) {
        return <span className="">{value}</span>;
    }

    return (
        <div className="flex flex-col gap-1">

            {/* Texto: completo o truncado según el estado */}
            <span className="">
                {expanded ? value : `${value.slice(0, maxChars)}...`}
            </span>

            {/* Botón toggle — sin estilos llamativos para no competir con la tabla */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="text-small text-text-primary underline self-start hover:opacity-70 transition-opacity"
            >
                {expanded ? "Ver menos" : "Ver más"}
            </button>

        </div>
    );
}

// ==================================================
//   Definición de columnas
// ==================================================
export const loansColumns = [

    // Columna ID préstamo
    {
        accessorKey: "idLoan",
        header: "ID Préstamo",
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
