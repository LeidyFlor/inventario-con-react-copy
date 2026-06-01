// Librería para manipulación y generación de archivos Excel
import * as XLSX from "xlsx";

// Función utilitaria para generar un archivo Excel a partir de datos tabulares
// Patrón: exportación de datos (dataset -> archivo descargable)
export function generateExcelReport({
    headers,
    rows,
    fileName = "loan-report.xlsx",
}) {
    const currentDate = new Date().toLocaleDateString("es-CO");
    const reportTitle = `=========== REPORTE DE PRÉSTAMOS - ${currentDate} ===========`;

    // Formatear filas: booleanos → texto legible
    const formattedRows = rows.map((row) =>
        row.map((cell) => {
            if (cell === true  || cell === "true")  return "Activo";
            if (cell === false || cell === "false") return "Inactivo";
            return cell ?? "";
        }),
    );

    // Fila 0 → título | Fila 1 → vacía | Fila 2 → headers | Fila 3+ → datos
    const worksheetData = [[reportTitle], [], headers, ...formattedRows];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge del título a lo ancho de todas las columnas
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];

    worksheet["!cols"] = headers.map(() => ({ wch: 25 }));
    worksheet["!rows"] = [{ hpt: 25 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Préstamos");

    // Descarga manual con Blob: más confiable que XLSX.writeFile() en browsers con bundler.
    // Se agrega el <a> al DOM y se remueve inmediatamente después del click
    // para garantizar compatibilidad con Firefox además de Chrome/Edge.
    XLSX.writeFile(workbook, fileName);
}
