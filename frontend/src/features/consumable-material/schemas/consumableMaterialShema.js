import { z } from "zod";

export const consumableMaterialShema = z.object({
  materialBarcodeSena: z
    .string()
    .min(10, "La placa Sena debe de tener mas de 10 caractéres")
    .max(20, "La placa debe de tener máximo 20 caractéres")
    .optional()
    .or(z.literal("")),

  // Marca y modelo son opcionales: hay insumos genéricos que no tienen
  // marca identificable ni referencia de modelo
  brandName: z.string().optional().or(z.literal("")),

  materialModel: z
    .string()
    .max(150, "El modelo es demasiado largo")
    .optional()
    .or(z.literal("")),

  // Inventario y categoría son obligatorios. El Select entrega el id como
  // texto, así que basta con exigir que no venga vacío.
  inventoryName: z.string().min(1, "Debe seleccionar un nombre de inventario"),
  category: z.string().min(1, "Debe seleccionar una categoría"),

  // Un material puede tener varios cuentadantes, mínimo uno.
  // El MultiSelect entrega un arreglo de ids como texto.
  inventoryManagers: z
  .array(z.string())
  .min(1, "Debe seleccionar al menos un cuentadante"),

  materialDescription: z
      .string()
      .max(500, "Descripción demasiado larga")
      .min(5, "Ingrese una descipcion"),

  materialName: z
    .string()
    .min(
      2,
      "El nombre del materrial no puede estar vacío, mínimo 2 caractéres ",
    )
    .max(150, "Nombre del material muy largo"),

  materialQuantity: z.coerce
    .number({
      invalid_type_error: "Debe ser un número",
    })
    .positive("El número debe ser positivo") // Valida que sea > 0
    .int("Debe ser un número entero")
    .min(1, "El valor mínimo debe ser 1")
    .max(99999999999, "La cantidad no puede superar los 11 dígitos"),

  materialUnitPrice: z.coerce
    .number({
      invalid_type_error: "Debe ser un número",
    })
    .nonnegative("El valor unitario no puede ser negativo")
    .min(1, "El material debe tener valor unitario positivo"),

  materialLocation: z
    .string()
    .max(150, "Resuma la ubicación del material")
    .optional(),

  // S/N (número de serie): opcional, igual que en devolutivo
  materialSerial: z
    .string()
    .max(100, "El S/N es demasiado largo")
    .optional()
    .or(z.literal("")),

  // Fechas de adquisición: obligatorias, llegan como "YYYY-MM-DD"
  materialPurchaseDate: z.string().min(1, "La fecha de compra es obligatoria"),
  materialEntryDate: z.string().min(1, "La fecha de ingreso es obligatoria"),

  materialImage: z.array(z.instanceof(File)).optional(),

  // La ficha técnica es obligatoria: al menos un archivo. El backend también
  // lo valida, porque los archivos no pasan por el serializer.
  materialTechnicalSheet: z
    .array(z.instanceof(File))
    .min(1, "Debes adjuntar al menos una ficha técnica"),
}).superRefine((data, ctx) => {
    if (data.materialBarcodeSena?.trim() && data.materialQuantity !== 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Si el material tiene placa SENA, la cantidad debe ser 1",
            path: ["materialQuantity"],
        })
    }

    // La compra no puede ser posterior al ingreso
    if (
        data.materialPurchaseDate &&
        data.materialEntryDate &&
        data.materialPurchaseDate > data.materialEntryDate
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de ingreso no puede ser anterior a la de compra",
            path: ["materialEntryDate"],
        })
    }
});