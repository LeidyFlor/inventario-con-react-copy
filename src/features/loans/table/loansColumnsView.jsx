// Columnas para la tabla de materiales de un préstamo (LoanMaterialsTable)
// Los accessorKey deben coincidir con las keys del array loanMaterials en loans.js:
// { name, placaSena, serial, cantidad, tipo }

export const loansColumnsView = [
    {
        accessorKey: "name",
        header: "Nombre",
    },
    {
        accessorKey: "placaSena",
        header: "Placa SENA",
    },
    {
        accessorKey: "serial",
        header: "Serial",
    },
    {
        accessorKey: "cantidad",
        header: "Cantidad",
    },
    {
        accessorKey: "tipo",
        header: "Tipo",
    },
];
