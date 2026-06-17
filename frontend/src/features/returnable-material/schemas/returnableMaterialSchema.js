// src/features/returnable-material/schemas/returnableMaterialSchema.js
import { z } from "zod"
import { fileSchema } from "@/shared"

export const returnableMaterialSchema = z.object({

    // ── Heredados del material base ──────────────────────────────────────────

    // En devolutivos la placa SENA es OBLIGATORIA (a diferencia de consumibles)
    materialBarcodeSena: z
        .string()
        .min(10, "La placa SENA debe tener mínimo 10 caracteres")
        .max(20, "La placa SENA no puede superar los 20 caracteres"),

    brandName: z.string().min(1, "Debe seleccionar una marca"),

    inventoryManager: z.string().min(1, "Debe seleccionar un cuentadante"),

    materialName: z
        .string()
        .min(2, "El nombre no puede estar vacío, mínimo 2 caracteres")
        .max(150, "Nombre del material muy largo"),

    materialDescription: z
        .string()
        .max(500, "Descripción demasiado larga")
        .optional()
        .or(z.literal("")),

    // La cantidad no aparece en el form — el backend la fija en 1 automáticamente
    materialUnitPrice: z.coerce
        .number({ invalid_type_error: "Debe ser un número" })
        .nonnegative("El valor unitario no puede ser negativo")
        .min(1, "El material debe tener valor unitario positivo"),

    materialLocation: z
        .string()
        .max(150, "Resuma la ubicación del material")
        .optional()
        .or(z.literal("")),

    // ── Exclusivos del material devolutivo ───────────────────────────────────

    returnableMaterialModel: z
        .string()
        .min(1, "El modelo no puede estar vacío")
        .max(150, "Nombre de modelo muy largo"),

    returnableMaterialSerial: z
        .string()
        .min(5, "El serial debe tener mínimo 5 caracteres")
        .max(100, "Serial demasiado largo"),

    returnableMaterialCategory: z
        .string()
        .min(1, "Debe seleccionar una categoría"),

    // Opcional salvo cuando la categoría es muebles_enseres (se valida con superRefine)
    returnableMaterialDimensions: z
        .string()
        .optional()
        .or(z.literal("")),

    // ── Archivos ─────────────────────────────────────────────────────────────
    materialImage: fileSchema.shape.files.optional(),
    materialTechnicalSheet: fileSchema.shape.files.optional(),

}).superRefine((data, ctx) => {
    // Dimensiones obligatorias y con formato solo para muebles_enseres
    if (data.returnableMaterialCategory === "muebles_enseres") {
        if (!data.returnableMaterialDimensions || data.returnableMaterialDimensions.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Las dimensiones son obligatorias para Muebles y enseres",
                path: ["returnableMaterialDimensions"],
            })
            return
        }

        const formato = /^\d+x\d+x\d+(cm|m|mm)$/i
        const limpio = data.returnableMaterialDimensions.replace(/\s+/g, "")
        if (!formato.test(limpio)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Formato inválido. Ej: 120x75x20cm",
                path: ["returnableMaterialDimensions"],
            })
        }
    }
})
