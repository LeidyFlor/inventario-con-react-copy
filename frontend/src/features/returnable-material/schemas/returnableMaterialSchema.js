// src/features/returnable-material/schemas/returnableMaterialSchema.js
import { z } from "zod"
import { fileSchema } from "@/shared"

export const returnableMaterialSchema = z
  .object({
    //  Heredados del material base

    // Placa SENA: obligatoria para maquinaria y muebles; opcional para herramienta
    materialBarcodeSena: z.string().optional().or(z.literal("")),

    // Marca opcional: hay materiales genéricos sin marca identificable
    brandName: z.string().optional().or(z.literal("")),

    // Inventario y categoría son obligatorios. El Select entrega el id como
    // texto, así que basta con exigir que no venga vacío.
    inventoryName: z.string().min(1, "Debe seleccionar un nombre de inventario"),
    // Cotizaciones: de 1 a 3. El tope espeja MAX_COTIZACIONES en
    // backend/backend_sigi/modules/materials/serializers.py
    quotations: z
      .array(z.string())
      .min(1, "Debe elegir al menos una cotización")
      .max(3, "Solo se pueden elegir hasta 3 cotizaciones"),
    category: z.string().min(1, "Debe seleccionar una categoría"),

    // Un material puede tener varios cuentadantes, mínimo uno.
    // El MultiSelect entrega un arreglo de ids como texto.
    inventoryManagers: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos un cuentadante"),

    materialName: z
      .string()
      .min(2, "El nombre no puede estar vacío, mínimo 2 caracteres")
      .max(150, "Nombre del material muy largo"),

    materialDescription: z
      .string()
      .max(500, "Descripción demasiado larga")
      .min(5, "Ingrese una descipcion"),

    materialUnitPrice: z.coerce
      .number({ invalid_type_error: "Debe ser un número" })
      .nonnegative("El valor unitario no puede ser negativo")
      .min(1, "El material debe tener valor unitario positivo"),

    materialLocation: z
      .string()
      .max(150, "Resuma la ubicación del material")
      .optional()
      .or(z.literal("")),

    // Cantidad: solo editable cuando herramienta sin placa
    materialQuantity: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null
          ? undefined
          : Number(val),
      z.number().min(1, "La cantidad debe ser mayor a 0").optional(),
    ),

    // ── Exclusivos del material devolutivo ───────────────────────────────────

    // Serial y modelo: opcionales
    returnableMaterialModel: z
      .string()
      .max(150, "Nombre de modelo muy largo")
      .optional()
      .or(z.literal("")),

    returnableMaterialSerial: z
      .string()
      .max(100, "Serial demasiado largo")
      .optional()
      .or(z.literal("")),

    returnableMaterialType: z
      .string()
      .min(1, "Debe seleccionar un tipo de material"),

    // Opcional salvo cuando el tipo es muebles_enseres (se valida con superRefine)
    returnableMaterialDimensions: z.string().optional().or(z.literal("")),

    // Fechas de adquisición: obligatorias. Son campos date, así que llegan
    // como "YYYY-MM-DD" y basta con verificar que no estén vacías.
    materialPurchaseDate: z.string().min(1, "La fecha de compra es obligatoria"),
    materialEntryDate: z.string().min(1, "La fecha de ingreso es obligatoria"),

    //  Archivos
    materialImage: z.array(z.instanceof(File)).optional(),
    // La ficha técnica es obligatoria: al menos un archivo. El backend también
    // lo valida, porque los archivos no pasan por el serializer.
    materialTechnicalSheet: z
      .array(z.instanceof(File))
      .min(1, "Debes adjuntar al menos una ficha técnica"),
  })
  .superRefine((data, ctx) => {
    const tipo = data.returnableMaterialType;
    const barcode = data.materialBarcodeSena?.trim() ?? "";
    const esHerramienta = tipo === "herramienta";

    // Placa SENA obligatoria para maquinaria y muebles
    if (!esHerramienta && !barcode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La placa SENA es obligatoria para este tipo de material",
        path: ["materialBarcodeSena"],
      });
    }

    // Cantidad obligatoria y > 0 cuando herramienta sin placa
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

    // Dimensiones obligatorias y con formato solo para muebles_enseres
    if (tipo === "muebles_enseres") {
      if (
        !data.returnableMaterialDimensions ||
        data.returnableMaterialDimensions.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Las dimensiones son obligatorias para Muebles y enseres",
          path: ["returnableMaterialDimensions"],
        });
        return;
      }

      const formato = /^\d+x\d+x\d+(cm|m|mm)$/i;
      const limpio = data.returnableMaterialDimensions.replace(/\s+/g, "");
      if (!formato.test(limpio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Formato inválido. Ej: 120x75x20cm",
          path: ["returnableMaterialDimensions"],
        });
      }
    }

    // La compra no puede ser posterior al ingreso: no se puede recibir en el
    // almacén algo que todavía no se ha comprado
    if (
      data.materialPurchaseDate &&
      data.materialEntryDate &&
      data.materialPurchaseDate > data.materialEntryDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de ingreso no puede ser anterior a la de compra",
        path: ["materialEntryDate"],
      });
    }
  });
