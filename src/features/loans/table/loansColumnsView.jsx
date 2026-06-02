//src/features/users/table/userColumns.js
// Componente que contiene los botones de acciones (editar y eliminar) para cada usuario
import LoanRowActions from "../components/LoanRowActions";

// Definición de las columnas de la tabla de usuarios
// Este arreglo suele usarse en librerías de tablas como TanStack Table

export const loansColumnsView = [

    // Columna ID
    {
        accessorKey: "materialName", // Campo del objeto user
        header: "Nombre",    // Encabezado visible
    },

    
    
    // Columna loanStudentsGroup
    {
        accessorKey: "materialBarcodeSena",
        header: "Placa SENA",
    },
    
    // Columna loanAssocietedMaterials
    {
        accessorKey: "materialQuantity", // Propiedad del objeto user que se mostrará en la columna
        header: "Cantidad",      // Título de la columnas
        
    },

    {
        accessorKey: "returnableMaterialSerial", // Propiedad del objeto user que se mostrará en la columna
        header: "Serial",      // Título de la columnas
        
    },

    {
        accessorKey: "loanType",
        header: "Tipo",
    },


        // {
        //     id: "actions", // No usa accessorKey porque no corresponde a un campo del usuario
    
    
        //     // Renderiza el componente de acciones pasando el usuario completo
        //     cell: ({ row }) => <LoanRowActions loan={row.original} />,
        // },
];
