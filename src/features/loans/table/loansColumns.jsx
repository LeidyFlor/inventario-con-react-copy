//src/features/users/table/userColumns.js
// Componente reutilizable que muestra un switch para activar o desactivar estados
import { StatusSwitch } from "@/shared/";

// Componente que contiene los botones de acciones (editar y eliminar) para cada usuario
import LoanRowActions from "../components/LoanRowActions";

// Definición de las columnas de la tabla de usuarios
// Este arreglo suele usarse en librerías de tablas como TanStack Table

export const loansColumns = [


    
    
    // Columna ID
    {
        accessorKey: "id", // Campo del objeto user
        header: "ID",    // Encabezado visible
    },

    
    
    // Columna loanStudentsGroup
    {
        accessorKey: "loanStudentsGroup",
        header: "Grupo aprendices",
    },
    
    // Columna loanAssocietedMaterials
    {
        accessorKey: "loanAssocietedMaterials", // Propiedad del objeto user que se mostrará en la columna
        header: "Materiales asociados",      // Título de la columnas
    },

    // Columna departureDate
    {
        accessorKey: "loanDateOut",
        header: "Fecha salida",
    },
    // Columna requestingUser
    {
        accessorKey: "loanUserRequester",
        header: "Usuario solicitante",
    },
    {
        accessorKey: "loanUserLender",
        header: "Usuario prestador",
    },
    // Columna status
    {
        accessorKey: "loanStatus",
        header: "Estado",
    },
    {
        accessorKey: "loanType",
        header: "Tipo de préstamo",
    },


    // Columna Estado (activo / inactivo)
    {
        accessorKey: "is_active",
        header: "",

    },

        {
            id: "actions", // No usa accessorKey porque no corresponde a un campo del usuario
    
    
            // Renderiza el componente de acciones pasando el usuario completo
            cell: ({ row }) => <LoanRowActions user={row.original} />,
        },
];
