// Campos disponibles para el reporte de préstamos
// default: true  → aparece marcado por defecto en el modal
// default: false → el usuario lo activa manualmente
export const loanReportFields = [
    {
        key: "loanStudentsGroup",
        label: "Ficha/Grupo",
        default: true,
    },
    {
        key: "loanMaterials",
        label: "Materiales asociados",
        default: true,
    },
    {
        key: "loanDateOut",
        label: "Fecha salida",
        default: true,
    },
    {
        key: "loanDateIn",
        label: "Fecha de entrega",
        default: true,
    },
    {
        key: "loanUserRequester",
        label: "Usuario solicitante",
        default: true,
    },
    {
        key: "loanJustification",
        label: "Justificación de uso",
        default: true,
    },
    {
        key: "loanUserLender",
        label: "Usuario prestador",
        default: false,
    },
    {
        key: "loanType",
        label: "Tipo de préstamo",
        default: false,
    },
    {
        key: "loanStatus",
        label: "Estado",
        default: false,
    },
];
