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
    // Marcado por defecto. Al desmarcarlo, el solicitante deja de elegirse de
    // la lista y se escribe su correo.
    requesterIsRegistered: z.boolean(),

    // Solo aplica cuando el solicitante SÍ está registrado
    loanUserRequester: z.string().optional().or(z.literal("")),

    // Solo aplica cuando NO está registrado
    requesterEmail: z.string().optional().or(z.literal("")),

    // Prestador: ya no se limita a cuentadantes, es cualquiera con permiso
    // de crear préstamos
    loanUserLender: z
      .string()
      .min(1, "Debe de seleccionar un prestador"),

    // Ficha de aprendices — opcional. Si se escribe, tiene que ser válida.
    loanStudentsGroup: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || (val.length === 7 && /^[0-9]+$/.test(val)),
        "Un número de grupo válido debe de tener 7 números",
      )
      .optional()
      .or(z.literal("")),

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
  )
  // El solicitante se exige en uno u otro campo según la casilla. No se puede
  // hacer con .min() en cada uno porque solo uno de los dos está en pantalla.
  .superRefine((data, ctx) => {
    if (data.requesterIsRegistered) {
      if (!data.loanUserRequester) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debe seleccionar usuario solicitante",
          path: ["loanUserRequester"],
        });
      }
      return;
    }

    const correo = (data.requesterEmail ?? "").trim();
    if (!correo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingrese el correo del solicitante",
        path: ["requesterEmail"],
      });
      return;
    }
    // Mismo criterio que EmailField de Django, que es quien valida al final
    if (!z.string().email().safeParse(correo).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingrese un correo electrónico válido",
        path: ["requesterEmail"],
      });
    }
  });