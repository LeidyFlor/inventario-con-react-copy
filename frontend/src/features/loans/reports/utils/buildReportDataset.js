import { formatearFecha } from "@/shared/components/utils/fechas";

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
        const buscado = normalize(loanUserRequester);
        filteredLoans = filteredLoans.filter((loan) =>
            // El ?? "" es necesario: cuando el solicitante no está registrado
            // el nombre puede llegar vacío, y normalize() reventaría al
            // llamar toLowerCase sobre null
            normalize(loan.loanUserRequester ?? "").includes(buscado),
        );
    }

    if (scope === "group" && loanStudentsGroup) {
        // Se compara como TEXTO, no como número.
        //
        // loan_students_group es un CharField en el backend, así que llega
        // como "3147206". La comparación anterior hacía === contra
        // Number(...), y en JavaScript "3147206" === 3147206 es false por la
        // diferencia de tipo: el filtro nunca encontraba nada y el reporte
        // siempre decía que no había préstamos.
        //
        // Además el tipo texto es el correcto: una ficha puede empezar por
        // cero, y convertirla a número se lo comería.
        const buscado = String(loanStudentsGroup).trim();
        filteredLoans = filteredLoans.filter(
            (loan) => String(loan.loanStudentsGroup ?? "").trim() === buscado,
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

            // Fechas → formato colombiano "DD/MM/YYYY".
            // formatearFecha y no new Date(): las fechas del préstamo llegan
            // sin hora, y new Date() las lee como UTC, lo que en Colombia
            // imprimía el día anterior en todo el reporte.
            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                return formatearFecha(value, value);
            }

            return value ?? "";
        }),
    );

    return { headers, rows };
}
