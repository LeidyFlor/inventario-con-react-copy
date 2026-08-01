import { z } from "zod";
import { fileSchema } from "@/shared";
const datePreprocess = (mensajeError) =>
  z.preprocess(
    //preprocess convirte la fecha "" a undefined (cuando se deja el campo de fecha sin llenar)
    (arg) => {
      if (typeof arg === "string" && arg.trim() === "") return null;
      if (typeof arg === "string" || arg instanceof Date) {
        const d = new Date(arg); //date guarda la fecha en milisegundos (2025-04-21T00:00:00.000Z), si no es fecha valida guarda NaN
        return isNaN(d.getTime()) ? undefined : d; // si es fecha inválida retorna null. getime lee el numero interno guardado
      }
      return null;
    },
    z
      .date()
      .nullable()
      .superRefine((val, ctx) => {
        if (val === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: mensajeError,
          });
        }
      }),
  );

export const userEditSchema = z
  .object({
    First_name: z.string().min(3, "Mínimo 3 caracteres").max(60),
    Last_name: z.string().min(3, "Mínimo 3 caracteres").max(60),
    userEmail: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
    userEmail2: z
      .string()
      .regex(
        /^[a-zA-Z0-9._%+-]+@(soy\.)?sena\.edu\.co$/,
        "Debe ser email institucional",
      )
      .optional()
      .or(z.literal("")),
    userTel: z.string().regex(/^[0-9]{10}$/, "Debe tener 10 dígitos"),
    userTel2: z
      .string()
      .regex(/^[0-9]{10}$/, "Debe tener 10 dígitos")
      .optional()
      .or(z.literal("")),
    userDocumentType: z.string().min(1, "Seleccione un tipo de documento"),
    userType: z.array(z.string()).min(1, "Debe seleccionar mínimo un tipo de usuario"),
    userDocument: z.string().min(5).max(20),
    userAddres: z.string().min(10).max(100),
    userDateStart: datePreprocess("La fecha de inicio es obligatoria"),
    userDateEnd: datePreprocess("La fecha fin es obligatoria"),
    // Igual que en userShema: si no se declaran, Zod los elimina y updateUser
    // los manda en false, borrándole la marca a cualquier usuario que se edite.
    is_accountant: z.boolean().default(false),
    is_staff: z.boolean().default(false),
    userImage: z.array(z.instanceof(File)).optional(),
  })
  .refine((data) => !data.userTel || data.userTel !== data.userTel2, {
    message: "Los teléfonos no pueden ser iguales",
    path: ["userTel2"],
  })
  .refine(
    (data) => {
      if (!data.userDateEnd || !data.userDateStart) return true;
      return data.userDateEnd >= data.userDateStart;
    },
    {
      message: "La fecha fin no puede ser anterior a la fecha de inicio",
      path: ["userDateEnd"],
    },
  );
