// Librería para generación de PDFs en el cliente
import jsPDF from "jspdf";

// Plugin para creación de tablas dentro del PDF
import autoTable from "jspdf-autotable";

// Función utilitaria para generar un reporte en PDF
// Patrón: exportación de datos (dataset -> documento estructurado)
export function generatePdfReport({
    headers,
    rows,
    fileName = "loan-report.pdf",
}) {
    // Umbral: si hay más de 6 columnas usa landscape
    const manyColumns = headers.length > 6;
    //Inicializa el documento PDF. landscape para que el infrome se imprima horizontalmente
    const doc = new jsPDF(manyColumns ? "landscape" : "portrait");

    doc.setFontSize(16);
    doc.text("Reporte de Préstamos", 14, 20);

    // Formatear las filas antes de pasarlas a la tabla
    const formattedRows = rows.map((row) =>
        row.map((cell) => {
            // Estado booleano
            if (cell === true  || cell === "true")  return "Activo";
            if (cell === false || cell === "false") return "Inactivo";
            return cell ?? "";
        }),
    );

    // Ancho util segun orientacion (en mm)
    const pageWidth   = manyColumns ? 277 : 190;
    const usableWidth = pageWidth - 28;

    //Generacion de tabla automatica
    autoTable(doc, {
        startY: 30, //Posicion unucual debajo del titulo\
        head: [headers], //Encabezados (debe ser array de arrays)
        body: formattedRows, //Filas del reporte con formato especial
        theme: "grid", //Estilo visual de la tabla

        // Estilos del encabezado
        headStyles: {
            fillColor: [0, 122, 51], //Color de fondo (RGB)(--tertiary-950:#007A33)
            textColor: 255, //Color del texto
            //Cuando hay 11 o 12 columnas se reduce el tamaño y padding
            fontSize: manyColumns ? 7 : 9,
            cellPadding: manyColumns ? 2 : 3,
            valign: "middle",
            halign: "center",
            overflow: "linebreak", // Permite word-wrap en encabezados
            minCellHeight: 12,
        },

        //Estilos globales de las celdas
        styles: {
            fontSize: manyColumns ? 6 : 9,
            cellPadding: manyColumns ? 2 : 3,
            overflow: "linebreak", // word-wrap en celdas de datos
        },

        // Con muchas columnas deja que autoTable distribuya el espacio
        // equitativamente entre todas las columnas
        tableWidth: manyColumns ? usableWidth : "auto",

        // Márgenes del documento
        margin: { 
            left: 14, 
            right: 14 
        },
    });

    doc.save(fileName);
}
