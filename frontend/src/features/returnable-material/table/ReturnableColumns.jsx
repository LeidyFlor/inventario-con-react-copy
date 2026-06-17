//src/features/users/table/userColumns.js
// Componente reutilizable que muestra un switch para activar o desactivar estados
import { StatusSwitch } from "@/shared/";

// Componente que contiene los botones de acciones (editar y eliminar) para cada usuario
import ReturnableRowAction from "../components/ReturnableRowAction";

// Definición de las columnas de la tabla de usuarios
// Este arreglo suele usarse en librerías de tablas como TanStack Table
export const ReturnableColumns = [

    {
        accessorKey: "materialName",
        header: "Nombre material",    // Encabezado visible
    },
    
    {
        accessorKey: "materialBarcodeSena",
        header: "Placa",
    },
    
    {
        accessorKey: "returnableMaterialSerial", 
        header: "Serial",      // Título de la columnas
    },

    {
        accessorKey: "returnableMaterialCategory",
        header: "Categoría",
    },
    {
        accessorKey: "inventoryManager",
        header: "Cuentadante",
    },

    // Columna Estado (activo / inactivo)
    {
        accessorKey: "is_active",
        header: "Estado",


        // Render personalizado de la celda
        // Permite mostrar un componente en lugar de solo texto
        cell: ({ row }) => {


            // Se obtiene el objeto completo del usuario de la fila
            const returnableMaterial = row.original;


            // Función que se ejecuta cuando cambia el switch
            const handleChange = (value) => {


                // value representa el nuevo estado del switch (true o false)
                console.log("Actualizar estado returnable:", returnableMaterial.id, value);


                // Aquí normalmente se llamaría una API para actualizar el estado
                // updateUserStatus(user.user_id, value)
            };


            return (
                // Componente reutilizable para mostrar el switch
                <StatusSwitch
                    checked={returnableMaterial.is_active} // Estado actual del usuario
                    onChange={handleChange}  // Función que maneja el cambio
                    className="inline-flex" // OJOOOOOO para que se ponga derecho flex
                />
            );
        },
    },


    // Columna de acciones (editar / eliminar)
    {
        id: "actions", // No usa accessorKey porque no corresponde a un campo del material


        // Renderiza el componente de acciones pasando el usuario completo
        cell: ({ row }) => <ReturnableRowAction returnable={row.original} />,
    },
];
