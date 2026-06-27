import { z } from "zod";

export const consumableEditSchema = z
    .object({
        brand: z.string().min(1, "Selecciona una marca"),
        inventoryManager: z.string().min(1, "Selecciona un cuentadante"),
        materialName: z.string().min(1, "El nombre es obligatorio"),
        materialDescription: z
            .string()
            .max(500, "Descripción demasiado larga")
            .min(5, "Ingrese una descipcion"),
        materialBarcodeSena: z.string().optional().or(z.literal("")),
        materialQuantity: z.preprocess(
            (val) => Number(val),
            z.number().min(1, "La cantidad debe ser mayor a 0")
        ),
        materialUnitPrice: z.preprocess(
            (val) => Number(val),
            z.number().min(1, "El precio debe ser mayor a 0")
        ),
        materialLocation: z.string().optional().or(z.literal("")),
        materialState: z.string().optional().or(z.literal("")),
        isActive: z.boolean(),
    })
    .superRefine((data, ctx) => {
        if (!data.isActive && !data.materialState) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Indica el motivo de inactividad",
                path: ["materialState"],
            });
        }
        if (data.materialBarcodeSena?.trim() && Number(data.materialQuantity) !== 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Si el material tiene placa SENA, la cantidad debe ser 1",
                path: ["materialQuantity"],
            });
        }
    });
