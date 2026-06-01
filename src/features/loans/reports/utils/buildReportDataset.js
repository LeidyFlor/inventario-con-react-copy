// Función utilitaria para construir el dataset de un reporte (tabla)
// Patrón: transformación de datos (input -> output listo para exportar)
export default function buildReportDataset({
    loans,
    selectedFields,
    scope,
    loanStudentsGroup,
    loanUserRequester,
}) {
    let filteredLoans = [...loans];

    // Normalización para búsqueda sin distinción de mayúsculas/tildes
    const normalize = (str) =>
        str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    if (scope === "requester" && loanUserRequester) {
        filteredLoans = filteredLoans.filter((loan) =>
            normalize(loan.loanUserRequester).includes(normalize(loanUserRequester)),
        );
    }

    if (scope === "group" && loanStudentsGroup) {
        filteredLoans = filteredLoans.filter(
            (loan) => loan.loanStudentsGroup === Number(loanStudentsGroup),
        );
    }

    const headers = selectedFields.map((field) => field.label);

    const rows = filteredLoans.map((loan) =>
        selectedFields.map((field) => {
            const value = loan[field.key];

            // ✅ Formateo de fechas ISO del backend → "DD/MM/YYYY, HH:MM a. m./p. m."
            // Las fechas reales vienen como "2025-08-25T08:15:23.651+00:00" (ISO 8601).
            // El mock de loans.js usa "25/8/2025" pero la API real envía ISO.
            // Se detecta el formato ISO y se convierte al formato legible colombiano.
            if (
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
            ) {
                return new Date(value).toLocaleString("es-CO", {
                    day:    "2-digit",
                    month:  "2-digit",
                    year:   "numeric",
                    hour:   "2-digit",
                    minute: "2-digit",
                });
            }

            return value ?? "";
        }),
    );

    return { headers, rows };
}
