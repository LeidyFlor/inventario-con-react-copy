import { z } from "zod"

export const returnableEditSchema = z
  .object({
    // Placa SENA: opcional (se valida condicionalmente en superRefine)
    materialBarcodeSena: z.string().optional().or(z.literal("")),

    // Marca opcional: hay materiales genéricos sin marca identificable
    brandName: z.string().optional().or(z.literal("")),

    inventoryManager: z.string().min(1, "Selecciona un cuentadante"),

    materialName: z
      .string()
      .min(2, "El nombre debe tener mínimo 2 caracteres")
      .max(150, "Nombre demasiado largo"),

    materialDescription: z
      .string()
      .max(500, "Descripción demasiado larga")
      .min(5, "Ingrese una descipcion"),

    materialUnitPrice: z.preprocess(
      (val) => Number(val),
      z
        .number({ invalid_type_error: "Debe ser un número" })
        .min(1, "El valor unitario debe ser mayor a 0"),
    ),

    materialLocation: z
      .string()
      .max(150, "Ubicación demasiado larga")
      .optional()
      .or(z.literal("")),

    // Serial y modelo opcionales
    returnableMaterialModel: z.string().optional().or(z.literal("")),

    returnableMaterialSerial: z.string().optional().or(z.literal("")),

    returnableMaterialCategory: z.string().min(1, "Selecciona una categoría"),

    returnableMaterialDimensions: z.string().optional().or(z.literal("")),

    // Cantidad: solo relevante cuando es herramienta sin placa
    materialQuantity: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? undefined
          : Number(val),
      z.number().min(1, "La cantidad debe ser mayor a 0").optional(),
    ),

    isActive: z.boolean(),

    materialState: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const category = data.returnableMaterialCategory;
    const barcode = data.materialBarcodeSena?.trim() ?? "";
    const esHerramienta = category === "herramienta";

    // Placa SENA obligatoria para maquinaria y muebles
    if (!esHerramienta && !barcode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La placa SENA es obligatoria para esta categoría",
        path: ["materialBarcodeSena"],
      });
    }

    // Motivo obligatorio cuando está inactivo
    if (!data.isActive && !data.materialState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indica el motivo de inactividad",
        path: ["materialState"],
      });
    }

    // Cantidad editable solo para herramienta sin placa
    if (esHerramienta && !barcode) {
      const qty = Number(data.materialQuantity);
      if (!qty || qty < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La cantidad debe ser mayor a 0",
          path: ["materialQuantity"],
        });
      }
    }

    // Dimensiones obligatorias para muebles_enseres
    if (category === "muebles_enseres") {
      if (!data.returnableMaterialDimensions?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Las dimensiones son obligatorias para Muebles y enseres",
          path: ["returnableMaterialDimensions"],
        });
        return;
      }
      const formato = /^\d+x\d+x\d+(cm|m|mm)$/i;
      if (
        !formato.test(data.returnableMaterialDimensions.replace(/\s+/g, ""))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Formato inválido. Ej: 120x75x20cm",
          path: ["returnableMaterialDimensions"],
        });
      }
    }
  });
