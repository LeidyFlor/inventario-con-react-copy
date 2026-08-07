const MATERIAL_TYPE_LABELS = {
    herramienta:        "Herramienta",
    maquinaria_equipos: "Maquinaria y equipos",
    muebles_enseres:    "Muebles y enseres",
};

const STATE_LABELS = {
    no_disponible: "No disponible",
    prestado:      "Prestado",
    traslado:      "Traslado",
    baja:          "Baja",
};

// Extrae el valor de un campo aplicando transformaciones especiales
const getValue = (m, field) => {
    if (field.key === "material_state") {
        if (m.is_active) return "Disponible";
        return STATE_LABELS[m.material_state] ?? m.material_state ?? "—";
    }
    if (field.key === "is_active") return m.is_active ? "Activo" : "Inactivo";
    if (field.key === "material_type") {
        return MATERIAL_TYPE_LABELS[m.material_type] ?? m.material_type ?? "—";
    }
    return m[field.key] ?? "";
};

const normalize = (str) =>
    str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function buildReportDataset({
    materials,
    selectedFields,
    scope,
    materialBarcodeSena,
    materialName,
    inventoryName,
}) {
    let filtered = [...materials];

    if (scope === "name" && materialName) {
        filtered = filtered.filter((m) =>
            normalize(m.material_name ?? "").includes(normalize(materialName))
        );
    }

    if (scope === "barcodeSena" && materialBarcodeSena) {
        filtered = filtered.filter(
            (m) => m.material_barcode_sena === materialBarcodeSena
        );
    }

    // Filtro por inventario: se compara contra el id, no contra el nombre, para
    // que dos inventarios con nombres parecidos no se mezclen
    if (scope === "inventoryName" && inventoryName) {
        filtered = filtered.filter(
            (m) => String(m.inventory_name) === String(inventoryName)
        );
    }

    const headers = selectedFields.map((f) => f.label);
    const rows    = filtered.map((m) => selectedFields.map((f) => getValue(m, f)));

    return { headers, rows };
}
