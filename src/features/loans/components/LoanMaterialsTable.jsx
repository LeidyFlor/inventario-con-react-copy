import DataTable from "@/shared/components/DataTable";
import { loansColumnsView } from "../table/loansColumnsView";
import { returnableMaterial } from "../../returnable-material/data/returnableMaterial";
import { materials } from "../../consumable-material/data/materials";

// Busca por primera palabra clave del materialName dentro del nombre parseado
// Ej: "Switch de Red 24 Puertos" → keyword "switch" → "switch cisco 24p".includes("switch") ✓
function findMaterialInfo(nombreParsed) {
    if (!nombreParsed) return { placaSena: "-", serial: "-", consumoQty: null };

    const nombreLower = nombreParsed.toLowerCase().trim();

    const matchReturnable = returnableMaterial.find((m) => {
        const keyword = m.materialName.toLowerCase().split(" ")[0];
        return nombreLower.includes(keyword);
    });

    const matchConsumable = materials.find((m) => {
        const keyword = m.materialName.toLowerCase().split(" ")[0];
        return nombreLower.includes(keyword);
    });

    return {
        placaSena:  matchReturnable ? matchReturnable.materialBarcodeSena          : "-",
        serial:     matchReturnable ? (matchReturnable.returnableMaterialSerial ?? "-") : "-",
        consumoQty: matchConsumable ? matchConsumable.materialQuantity              : null,
    };
}

export default function LoanMaterialsTable({ materialsString = "" }) {

    const rows = materialsString.split(",").map((item) => {
        const trimmed = item.trim();

        const match = trimmed.match(/^(.*?)(\d+)\s+(Devolutivo|Consumo)$/i);

        let nombre        = trimmed;
        let cantidadStr   = "1";
        let tipo          = "Consumo";

        if (match) {
            nombre      = match[1].trim();
            cantidadStr = match[2];          // cantidad del string original
            tipo        = match[3];
        } else {
            const parts = trimmed.split(" ");
            tipo        = parts[parts.length - 1];
            cantidadStr = parts[parts.length - 2];
            nombre      = parts.slice(0, -2).join(" ");
        }

        const { placaSena, serial, consumoQty } = findMaterialInfo(nombre);

        // Devolutivo → siempre 1
        // Consumo    → materialQuantity de materials.js; si no hay match, usa la cantidad del string
        const cantidad = tipo.toLowerCase() === "devolutivo"
            ? 1
            : (consumoQty ?? Number(cantidadStr));

        return {
            materialName:             nombre,
            materialBarcodeSena:      placaSena,
            returnableMaterialSerial: serial,
            materialQuantity:         cantidad,
            loanType:                 tipo,
        };
    });

    return (
        <DataTable
            data={rows}
            columns={loansColumnsView}
        />
    );
}
