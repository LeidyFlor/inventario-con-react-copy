import { getLoans } from "../../services/loanService";
import buildReportDataset from "../utils/buildReportDataset";
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

export async function generateLoanReport({
    format,
    selectedFields,
    scope,
    loanStudentsGroup,
    loanUserRequester,
}) {
    const loans = await getLoans();

    const { headers, rows } = buildReportDataset({
        loans,
        selectedFields,
        scope,
        loanStudentsGroup,
        loanUserRequester,
    });

    if (!rows.length) {
        throw new Error("sin_datos");
    }

    const timestamp = new Date().toISOString().slice(0, 10);

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
