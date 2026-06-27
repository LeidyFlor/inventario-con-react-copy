// Campos disponibles para el reporte — keys en snake_case (nombres reales del backend)
export const returnableReportFields = [
  { key: "material_barcode_sena",   label: "Placa SENA",       default: true  },
  { key: "material_name",           label: "Nombre material",  default: true  },
  { key: "brand_name",              label: "Marca",            default: true  },
  { key: "material_serial",         label: "Serial",           default: true  },
  { key: "material_model",          label: "Modelo",           default: true  },
  { key: "inventory_manager_name",  label: "Cuentadante",      default: true  },
  { key: "material_category",       label: "Categoría",        default: true  },
  { key: "material_description",    label: "Descripción",      default: false },
  { key: "material_quantity",       label: "Cantidad",         default: false },
  { key: "material_unit_price",     label: "Valor unitario",   default: false },
  { key: "material_total_price",    label: "Valor total",      default: false },
  { key: "material_location",       label: "Ubicación",        default: false },
  { key: "material_dimensions",     label: "Dimensiones",      default: false },
  { key: "material_state",          label: "Estado",           default: false },
  { key: "is_active",               label: "Disponibilidad",   default: false },
];
