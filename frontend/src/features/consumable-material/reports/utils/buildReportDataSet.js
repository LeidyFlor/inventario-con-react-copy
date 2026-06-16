//Funcion utilitaria para construir el dataset de un reporte (tabla)
//Patron: trasformacion de datos (input -> output listo para exportar)
export default function buildReportDataset({
  consumableMaterial, //Array de usuarios origen
  selectedFields, //Campos seleccionados para e reporte [{ key, label}]
  scope, //Alcance del reporte: "all" | "document"
  materialBarcodeSena, //Placa sena para filtrar (si aplica)
  materialName, //Filtro por nombre del material(si aplica)
}) {
  //Copia inmutable del array original (evita mutaciones)
  let filteredconsumableMaterial = [...consumableMaterial];
  //descarga por nombre del material, admite mayusculas minusculas y tildes para coincidier con el material
  const normalize = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  //filtro por alcence: nombre del material, si se aplica el filtro
  if (scope === "name" && materialName) {
    filteredconsumableMaterial = filteredconsumableMaterial.filter((consumableMaterial) =>
      normalize(consumableMaterial.materialName).includes(normalize(materialName)),
    );
  }
  //Filtro por alcance: si es por documento, se aplica filtro especifico
  if (scope === "barcodeSena" && materialBarcodeSena) {
    filteredconsumableMaterial = filteredconsumableMaterial.filter(
      (consumableMaterial) => consumableMaterial.materialBarcodeSena === materialBarcodeSena,
    );
  }

  //Construccion de encabezados del reporte
  //Se toma el label de cada campo seleccionado
  const headers = selectedFields.map((field) => field.label);

  //Construccion de filas del reporte
  // Cada usuario se trasforma en un array de valores segun los campos seleccionados
  const rows = filteredconsumableMaterial.map((consumableMaterial) =>
    selectedFields.map((field) => {
      const value = consumableMaterial[field.key]; //Acceso dinamico a la propiedad

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