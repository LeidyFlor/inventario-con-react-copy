import { Alert } from "@/shared";
import { getMaterials } from "../../services/materialService";
import buildReportDataset from "../utils/buildReportDataSet";
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

export async function generateConsumableReport({
    format,
    selectedFields,
    scope,
    materialBarcodeSena,
    materialName,
    inventoryName,
}) {
    const consumableMaterial = await getMaterials();

    const { headers, rows } = buildReportDataset({
        consumableMaterial,
        selectedFields,
        scope,
        materialBarcodeSena,
        materialName,
        inventoryName,
    });

    if (!rows.length) {
        throw new Error("sin_datos");
    }

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === "excel") {
        generateExcelReport({ 
            headers,
            rows,
            fileName: `consumable-material-report-${timestamp}.xlsx` });
    }
    if (format === "pdf") {
        generatePdfReport({ 
            headers, 
            rows, 
            fileName: `consumable-material-report-${timestamp}.pdf` });
    }
}
