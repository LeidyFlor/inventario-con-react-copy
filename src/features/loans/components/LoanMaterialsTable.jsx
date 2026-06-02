import DataTable from "@/shared/components/DataTable";
import { loansColumnsView } from "../table/loansColumnsView";

// Recibe el array loanMaterials de loans.js y lo muestra en la tabla
// Cada item ya tiene: { id, name, placaSena, serial, cantidad, tipo }
export default function LoanMaterialsTable({ materials = [] }) {

    // Consumo → placaSena y serial son null, se muestran como "-"
    const rows = materials.map((item) => ({
        name:      item.name,
        placaSena: item.placaSena ?? "-",
        serial:    item.serial    ?? "-",
        cantidad:  item.cantidad,
        tipo:      item.tipo,
    }));

    return (
        <DataTable
            data={rows}
            columns={loansColumnsView}
        />
    );
}
