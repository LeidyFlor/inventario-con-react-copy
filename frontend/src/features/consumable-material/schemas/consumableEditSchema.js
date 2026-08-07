import { z } from "zod";

export const consumableEditSchema = z
    .object({
        // Marca y modelo son opcionales en los dos tipos de material
        brand: z.string().optional().or(z.literal("")),
        materialModel: z
            .string()
            .max(150, "El modelo es demasiado largo")
            .optional()
            .or(z.literal("")),
        // Inventario y categoría son obligatorios. El Select entrega el id
        // como texto, así que basta con exigir que no venga vacío.
        inventoryName: z.string().min(1, "Debe seleccionar un nombre de inventario"),
        category: z.string().min(1, "Debe seleccionar una categoría"),
        // Un material puede tener varios cuentadantes, mínimo uno.
        // El MultiSelect entrega un arreglo de ids como texto.
        inventoryManagers: z
        .array(z.string())
        .min(1, "Debe seleccionar al menos un cuentadante"),
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
        // S/N opcional, igual que en devolutivo
        materialSerial: z.string().optional().or(z.literal("")),
        // Fechas de adquisición: obligatorias, llegan como "YYYY-MM-DD"
        materialPurchaseDate: z.string().min(1, "La fecha de compra es obligatoria"),
        materialEntryDate: z.string().min(1, "La fecha de ingreso es obligatoria"),
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
            });
        }
    });
