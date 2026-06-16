import { X } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import { IconButtonReal } from "@/shared";

// Recibe el array loanMaterials de loans.js y lo muestra en la tabla
// Cada item ya tiene: { id, name, placaSena, serial, cantidad, tipo }
export default function LoanMaterialsTable({ 
        materials = [],     // - materials: lista de materiales que se mostrarán en la tabla
        editable = false,   // - editable: controla si la tabla se puede editar
        onQuantityChange,   // - onQuantityChange: callback cuando se cambia la cantidad de un material
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
            header: () => <span className="block min-w-[8rem] lg:min-w-0">Nombre</span>,
            cell: ({ row }) => (
                <span className="block min-w-[8rem] lg:min-w-0">
                    {row.original.name}
                </span>
            ),
        },
        {
            accessorKey: "placaSena",
            header: () => <span className="block min-w-[7rem] lg:min-w-0">Placa SENA</span>,
            cell: ({ row }) => (
                <span className="block min-w-[7rem] lg:min-w-0 whitespace-nowrap">
                    {row.original.placaSena}
                </span>
            ),
        },
        {
            accessorKey: "serial",
            header: () => <span className="block min-w-[7rem] lg:min-w-0">Serial</span>,
            cell: ({ row }) => (
                <span className="block min-w-[7rem] lg:min-w-0 whitespace-nowrap">
                    {row.original.serial}
                </span>
            ),
        },
        {
            accessorKey: "cantidad",
            header: () => <span className="block min-w-[5rem] lg:min-w-0">Cantidad</span>,

            // En modo no editable se muestra solo el valor actual.
            // En modo editable la cantidad será editable SÓLO para materiales de tipo consumo. 
            // Para materiales devolutivos mostramos el valor fijo y no permitimos la edición desde aquí.
            cell: ({ row }) => {
                const tipo = String(row.original.tipo ?? "").toLowerCase();
                const EditQuantity = editable && tipo.includes("consum");

                if (!EditQuantity) {
                    return (
                        <span className="block min-w-[5rem] lg:min-w-0">
                            {row.original.cantidad}
                        </span>
                    );
                }

                return (
                    <input
                        type="number"
                        min="0"
                        value={row.original.cantidad ?? ""}
                        onChange={(event) => {
                            // Mantener controlado como string antes de parsear
                            const value = event.target.value;
                            const parsed = value === "" ? "" : Number(value);
                            onQuantityChange?.(
                                row.original.id,
                                value === "" || Number.isNaN(parsed) ? 0 : parsed
                            );
                        }}
                        className="w-20 rounded-xl border border-border px-3 py-2 text-body text-text-primary"
                    />
                );
            },
        },
        {
            accessorKey: "tipo",
            header: () => <span className="block min-w-[6rem] lg:min-w-0">Tipo</span>,
            cell: ({ row }) => (
                <span className="block min-w-[6rem] lg:min-w-0 whitespace-nowrap">
                    {row.original.tipo}
                </span>
            ),
        },
    ];

    // Solo se agrega la columna de acciones cuando la tabla está en modo editable
    if (editable) {
        columns.push({
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex min-w-[5rem] lg:min-w-0 justify-end">
                    <IconButtonReal
                        label="Remover"
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
