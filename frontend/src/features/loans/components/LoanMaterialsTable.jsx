import { X } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import { IconButtonReal } from "@/shared";

// Recibe el array loanMaterials de loans.js y lo muestra en la tabla
// Cada item ya tiene: { id, name, placaSena, serial, cantidad, tipo }
//
// La cantidad NO se puede editar, en ningún modo. Antes los consumibles traían
// un campo editable, pero solo cambiaba el estado de la pantalla: el servicio
// nunca lo enviaba y el backend tampoco lo acepta, así que el número se perdía
// al guardar. Para cambiar una cantidad hay que quitar el material y volverlo a
// agregar, que es lo único que ajusta el inventario correctamente.
export default function LoanMaterialsTable({
        materials = [],     // - materials: lista de materiales que se mostrarán en la tabla
        editable = false,   // - editable: agrega la columna de acciones (Quitar)
        onRemoveMaterial    // - onRemoveMaterial: callback cuando se quita un material de la tabla
    }) {
    // Normaliza valores nulos para que la tabla no muestre celdas vacías
    const rows = materials.map((item) => ({
        ...item,
        placaSena: item.placaSena ?? "-",
        serial: item.serial ?? "-",
    }));

    const columns = [
        {
            accessorKey: "name",
            header: () => <span className="block min-w-32">Nombre</span>,
            cell: ({ row }) => (
                <span className="block min-w-32 py-3">
                    {row.original.name}
                </span>
            ),
        },
        {
            accessorKey: "placaSena",
            header: () => <span className="block min-w-24">Placa SENA</span>,
            cell: ({ row }) => (
                <span className="block min-w-24 py-3 whitespace-nowrap">
                    {row.original.placaSena}
                </span>
            ),
        },
        {
            accessorKey: "serial",
            header: () => <span className="block min-w-24">Serial</span>,
            cell: ({ row }) => (
                <span className="block min-w-24 py-3 whitespace-nowrap">
                    {row.original.serial}
                </span>
            ),
        },
        {
            accessorKey: "cantidad",
            header: () => <span className="block min-w-20 text-center">Cantidad</span>,
            cell: ({ row }) => (
                <span className="block min-w-20 py-3 text-center">
                    {row.original.cantidad}
                </span>
            ),
        },
        {
            accessorKey: "tipo",
            header: () => <span className="block min-w-24">Tipo</span>,
            cell: ({ row }) => (
                <span className="block min-w-24 py-3 whitespace-nowrap">
                    {row.original.tipo}
                </span>
            ),
        },
    ];

    // Solo se agrega la columna de acciones cuando la tabla está en modo editable
    if (editable) {
        columns.push({
            id: "actions",
            header: () => <span className="block min-w-12"></span>,
            cell: ({ row }) => (
                <div className="flex min-w-12 hover:text-error">
                    <IconButtonReal
                        label="Quitar"
                        variant="outline"
                        onClick={() => onRemoveMaterial?.(row.original.id)}
                    >
                        <X size={18} />
                    </IconButtonReal>
                </div>
            ),
        });
    }

    return (
        <DataTable
            data={rows}
            columns={columns}
        />
    );
}
