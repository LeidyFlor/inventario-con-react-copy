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

            // Materiales asociados: array → texto "Nombre (x cant.tipo), ..."
            if (field.key === "loanMaterials" && Array.isArray(value)) {
                return value
                    .map((m) => {
                        const name = m.name ?? m.material_name ?? "";
                        const qty  = m.cantidad ?? m.quantity_loaned ?? 1;
                        const tipo = m.tipo ?? m.material_type ?? "";
                        return `${name} (x${qty} ${tipo})`;
                    })
                    .join(", ") || "—";
            }

            // Fechas ISO → formato colombiano "DD/MM/YYYY"
            if (
                typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}/.test(value)
            ) {
                const d = new Date(value);
                if (!isNaN(d)) {
                    return d.toLocaleDateString("es-CO", {
                        day:   "2-digit",
                        month: "2-digit",
                        year:  "numeric",
                    });
                }
            }

            return value ?? "";
        }),
    );

    return { headers, rows };
}
