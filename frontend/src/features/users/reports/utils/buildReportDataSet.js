//Funcion utilitaria para construir el dataset de un reporte (tabla)
//Patron: transporfmacion de datos (input -> output listo para exportar)
export default function buildReportDataset({
  users, //Array de usuarios origen
  selectedFields, //Campos seleccionados para e reporte [{ key, label}]
  scope, //Alcance del reporte: "all" | "document"
  userDocument, //Numero de documento para diltrar (si aplica)
}) {
  //Copia inmutable del array original (evita mutaciones)
  let filteredUsers = [...users];

  //Filtro por alcance: si es por documento, se aplica filtro especifico. se siltra con el user_document del backend
  if (scope === "document" && userDocument) {
    filteredUsers = filteredUsers.filter(
      (user) => user.user_document === userDocument,
    );
  }

  //Construccion de encabezados del reporte
  //Se toma el label de cada campo seleccionado
  const headers = selectedFields.map((field) => field.label);

  //Construccion de filas del reporte
  // Cada usuario se trasforma en un array de valores segun los campos seleccionados
  const rows = filteredUsers.map((user) =>
    selectedFields.map((field) => {
      const value = user[field.key]; //Acceso dinamico a la propiedad

      //caso especial de los grupos. lee cada nombre de grupo y lo concatena con una coma
      if(field.key === "groups" && Array.isArray(value)){
        return value.map(g => g.name).join(", ")
      }

      //Normalizacion: evita undefined o null en el reporte. EN vez de dar error imprima vacio
      return value ?? "";
    }),
  );

  //Estructura final desacoplada de la UI
  // Lista para exporta a Excel, PDF o renderizar en tabla
  return {
    headers, //Array de strings (columnas)
    rows, //Array de arrays (filas)
  };
}
