import { getReturnables } from "../../services/returnableService";
import buildReportDataset from "../utils/buildReportDataSet";
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

export async function generateReturnableReport({
    format,
    selectedFields,
    scope,
    materialBarcodeSena,
    materialName,
}) {
    const materials = await getReturnables();

    const { headers, rows } = buildReportDataset({
        materials,
        selectedFields,
        scope,
        materialBarcodeSena,
        materialName,
    });

    if (!rows.length) {
        throw new Error("sin_datos");
    }

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === "excel") {
        generateExcelReport({
            headers,
            rows,
            fileName: `returnable-material-report-${timestamp}.xlsx`,
        });
    }
    if (format === "pdf") {
        generatePdfReport({
            headers,
            rows,
            fileName: `returnable-material-report-${timestamp}.pdf`,
        });
    }
}
