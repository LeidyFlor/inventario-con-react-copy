//Libreria para generacion de PDFs en el cliente
import jsPDF from "jspdf";

//Plugin para creacion de tablas dentro del PDF
import autoTable from "jspdf-autotable";

//Funcion utilitaria para generar un reporte en PDF
// Patron: exportacion de datos (dataset -> documento estructurado)
export function generatePdfReport({
  headers, //Encabezados de la tabla (columnas)
  rows, //Datos (arrays de filas)
  fileName = "user-report.pdf", //Nombre del archivo de salida
}) {
  // Umbral: si hay más de 10 columnas, cambia la estrategia
  const manyColumns = headers.length > 10;
  //Inicializa el documento PDF. landscape para que el infrome se imprima horizontalmente
  const doc = new jsPDF( "landscape" );

  //Configuracion del titulo
  doc.setFontSize(16);
  doc.text("Reporte de usuarios", 14, 20); //Posicion ( X, Y)

  // Formatear las filas antes de pasarlas a la tabla (fecha y estado)
  const formattedRows = rows.map((row) =>
    row.map((cell) => {
      // Formateo de fechas (detecta formato ISO 📆)
      if (typeof cell === "string" && /^\d{4}-\d{2}-\d{2}T/.test(cell)) {
        return new Date(cell).toLocaleString("es-CO", {
          year: "numeric",
          month: "2-digit",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      // Formateo de estado booleano
      if (cell === true || cell === "true") return "Activo";
      if (cell === false || cell === "false") return "Inactivo";

      return cell ?? "";
    }),
  );
  // Ancho util segun orientacion (en mm)
  const pageWidth = manyColumns ? 277 : 190;
  const usableWidth = pageWidth - 20; // margen left + right (10 + 10)

  //Generacion de tabla automatica
  autoTable(doc, {
    startY: 30, //Posicion unucual debajo del titulo\
    head: [headers], //Encabezados (debe ser array de arrays)
    body: formattedRows, //Filas del reporte con formato especial 👁️
    theme: "grid", //Estilo visual de la tabla

    //Estilos del encabezado
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
      fontSize: manyColumns ? 7 : 9,
      cellPadding: manyColumns ? 2 : 3,
      overflow: "linebreak", // word-wrap en celdas de datos
    },
    // Con muchas columnas deja que autoTable distribuya el espacio
    // equitativamente entre todas las columnas
    tableWidth: manyColumns ? usableWidth : "auto",

    //Margenes del documento
    margin: {
      left: 14,
      right: 14,
    },
  });

  //Genera y descarga el archivo PDF
  doc.save(fileName);
}