import { z } from "zod";
import { consumableMaterialShema } from "../../consumable-material/schemas/consumableMaterialShema"; //importa el esquema de materiales de consumo para heredar las validaciones

export const returnableMaterialSchema = consumableMaterialShema
  .extend({
    returnableMaterialSerial: z
      .string()
      .min(5, "El serial no puede estar vacío")
      .max(100, "Límite de caracteres alcanzados del serial"),

    returnableMaterialCategory: z
      .string()
      .min(1, "Debe seleccionar una categpría"),

    returnableMaterialDimensions: z
      .string()
      .optional() //para campos opcionales
      .or(z.literal("")),

    returnableMaterialModel: z
      .string()
      .min(1, "El modelo no puede estar vacío")
      .max(150, "Nombre de modelo muy largo"),
  })
  //El string a comparar en este caso es la llave del json de la opcion. EN ESTE CASO 3 = "Muebles y enseres"
  //  un superrefine puede hacer varias validaciones y sacar mensajes de error difente
  .superRefine((data, ctx) => {
    if (data.returnableMaterialCategory === "3") {
      // Valida que no esté vacío
      if (
        !data.returnableMaterialDimensions ||
        data.returnableMaterialDimensions.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Las dimensiones son obligatorias para muebles y enseres",
          path: ["returnableMaterialDimensions"],
        });
        return;
      }

      // Valida el formato
      const formato = /^\d+x\d+x\d+(cm|m|mm)$/i;
      const valorLimpio = data.returnableMaterialDimensions.replace(
        /\s+/g,
        "",
      );
      if (!formato.test(valorLimpio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Formato inválido. Ej: 120x75x20cm",
          path: ["returnableMaterialDimensions"],
        });
      }
    }
  });