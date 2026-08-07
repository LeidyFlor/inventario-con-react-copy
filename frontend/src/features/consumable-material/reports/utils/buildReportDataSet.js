// Construye el dataset para exportar (headers + rows)
export default function buildReportDataset({
    consumableMaterial,
    selectedFields,
    scope,
    materialBarcodeSena,
    materialName,
    inventoryName,
}) {
    const normalize = (str) =>
        str?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") ?? "";

    let filtered = [...consumableMaterial];

    if (scope === "name" && materialName) {
        filtered = filtered.filter(m =>
            normalize(m.material_name).includes(normalize(materialName))
        );
    }
    if (scope === "barcodeSena" && materialBarcodeSena) {
        filtered = filtered.filter(m =>
            m.material_barcode_sena === materialBarcodeSena
        );
    }

    // Filtro por inventario: se compara contra el id, no contra el nombre, para
    // que dos inventarios con nombres parecidos no se mezclen
    if (scope === "inventoryName" && inventoryName) {
        filtered = filtered.filter(m =>
            String(m.inventory_name) === String(inventoryName)
        );
    }

    const STATE_LABELS = {
        no_disponible: "No disponible",
        prestado: "Prestado",
        traslado: "Traslado",
        baja: "Baja",
    };

    const getValue = (m, f) => {
        if (f.key === "material_state") {
            if (m.is_active) return "Disponible";
            return STATE_LABELS[m.material_state] ?? m.material_state ?? "—";
        }
        if (f.key === "is_active") {
            return m.is_active ? "Activo" : "Inactivo";
        }
        return m[f.key] ?? "";
    };

    const headers = selectedFields.map(f => f.label);
    const rows = filtered.map(m =>
        selectedFields.map(f => getValue(m, f))
    );

    return { headers, rows };
}