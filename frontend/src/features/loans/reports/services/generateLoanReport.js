// Fuente de datos de préstamos (mock o fuente centralizada)
import { loans } from "../../data/loans";

// Utilidad para transformar datos en dataset de reporte
import buildReportDataset from "../utils/buildReportDataset";

// Servicios de exportación
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

// Caso de uso: orquestador de generación de reportes de préstamos
// Patrón: Application Service (coordina utilidades y servicios)
export function generateLoanReport({
    format,             // "excel" | "pdf"
    selectedFields,     // Campos seleccionados por el usuario
    scope,              // Alcance del reporte: "all" | "group" | "requester"
    loanStudentsGroup,  // Filtro opcional por ficha/grupo
    loanUserRequester,  // Filtro opcional por nombre del solicitante
}) {
    // Construcción del dataset (desacoplado de la UI)
    const { headers, rows } = buildReportDataset({
        loans,
        selectedFields,
        scope,
        loanStudentsGroup,
        loanUserRequester,
    });

    // Validación: evita generar archivos vacíos
    if (!rows.length) {
        alert("No hay datos para generar el reporte.");
        return; // Corte de ejecución
    }

    // Generación de timestamp para nombres únicos de archivo (YYYY-MM-DD)
    const timestamp = new Date().toISOString().slice(0, 10);

    // Selección de estrategia de exportación según formato
    if (format === "excel") {
        generateExcelReport({
            headers,
            rows,
            fileName: `loans-report-${timestamp}.xlsx`,
        });
    }

    if (format === "pdf") {
        generatePdfReport({
            headers,
            rows,
            fileName: `loans-report-${timestamp}.pdf`,
        });
    }
}
