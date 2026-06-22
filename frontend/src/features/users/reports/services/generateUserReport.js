import { Alert } from "@/shared";
//Funte de datos de usuarios (mock o fuente centralizada)
import { getUsers } from "../../services/userService";

//Utilidad pra transformar datos en dataset de reporte
import buildReportDataset from "../utils/buildReportDataSet";

//Servicios de exportacion
import { generateExcelReport } from "./generateExcelReport";
import { generatePdfReport } from "./generatePdfReport";

//Caso de uso: orquestador de generacion de reportes de usuarios
//Patron: Aplication services (coordina utilidades y servicios)
export async function generateUserReport({
  format, //"excel" | "pdf"
  selectedFields, //Campos seleccionados por el usuario
  scope, //Alcance del reporte
  userDocument, //Filtro opcional
}) {
  const users = await getUsers()
  //Construccion del dataset (desacoplado de la UI)

  const { headers, rows } = buildReportDataset({
    users,
    selectedFields,
    scope,
    userDocument,
  });

  //Validacion: evita generar archivos vacios
  if (!rows.length) {
    Alert.error("No hay datos para generar el reporte.");
    return; //Corte de ejecucion
  }

  //Generaficon de timestamps para nombres unicos de archivo (YYYY-MM-DD)
  //toISoString(): Convierte una fecha a formato estandar UTC
  const timestamp = new Date().toISOString().slice(0, 10);

  //Seleccion de estrategia de exportacion segun formato
  if (format === "excel") {
    generateExcelReport({
      headers,
      rows,
      fileName: `users-report-${timestamp}.xlsx`,
    });
  }
  if (format === "pdf") {
    generatePdfReport({
      headers,
      rows,
      fileName: `users-report-${timestamp}.pdf`,
    });
  }
}