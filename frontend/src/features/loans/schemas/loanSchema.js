import { z } from "zod";
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

export const loanSchema = z
  .object({
    loanUserRequester: z
      .string()
      .min(1, "Debe seleccionar usuario solicitante"),

    loanStudentsGroup: z
      .string()
      .trim()
      .min(7, "Un número de grupo válido debe de tener 7 números")
      .max(7, "Un número de grupo válido debe de tener 7 números")
      .regex(/^[0-9]+$/, "Debe contener solo números"),

    loanJustification: z
        .string()
        .min(10, "Ingrese una justificación más detallada")
        .max(500, "Justificación demasiado larga")
    ,

    loanType: z
        .string()
        .min(1, "Debe seleccionar el tipo de préstamo"),

    loanDateOut: datePreprocess(
      "La fecha de inicio es obligatoria",
      "Fecha de inicio inválida",
    ),

    loanDateIn: datePreprocess(
      "La fecha fin es obligatoria",
      "Fecha de fin inválida",
    ),
  })
  //Valida que la fecha fin no sea antes que la de inicio
  .refine(
    (data) => {
      if (!data.loanDateIn || !data.loanDateOut) return true; //si alguna de las fechas es nula, se debe activar el error de fecha inválida
      return data.loanDateIn >= data.loanDateOut;
    },
    {
      message: "La fecha de entrega no puede ser anterior a la fecha de salida",
      path: ["loanDateIn"],
    },
  );