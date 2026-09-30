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

// Compartida por los dos esquemas para no tener la misma regla escrita dos veces
const reglaJustificacion = z
  .string()
  .min(10, "Ingrese una justificación más detallada")
  .max(500, "Justificación demasiado larga");

// Mensaje único: la regla es la misma en crear y en editar
const MENSAJE_FECHA_INVERTIDA =
  "La fecha de entrega no puede ser anterior a la fecha de salida";

const fechaEntregaValida = (data) => {
  // Si falta alguna, el error lo reporta el campo por su cuenta
  if (!data.loanDateIn || !data.loanDateOut) return true;
  return data.loanDateIn >= data.loanDateOut;
};

/**
 * Esquema de la pantalla de EDITAR préstamo.
 *
 * Solo lleva los tres campos que esa pantalla puede cambiar de verdad. El
 * resto —solicitante, prestador, tipo, ficha, fecha de salida— está
 * deshabilitado en el formulario y el backend tampoco los acepta
 * (ver LoanUpdateSerializer), así que validarlos aquí solo servía para
 * bloquear el guardado con errores que nadie podía ver ni corregir.
 *
 * loanDateOut va incluida aunque no se pueda editar: hace falta para
 * comprobar que la fecha de entrega no quede antes que ella.
 */
export const loanEditSchema = z
  .object({
    loanJustification: reglaJustificacion,
    loanDateOut: datePreprocess("La fecha de inicio es obligatoria"),
    loanDateIn:  datePreprocess("La fecha fin es obligatoria"),
  })
  .refine(fechaEntregaValida, {
    message: MENSAJE_FECHA_INVERTIDA,
    path: ["loanDateIn"],
  });

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

    loanJustification: reglaJustificacion,

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
  .refine(fechaEntregaValida, {
    message: MENSAJE_FECHA_INVERTIDA,
    path: ["loanDateIn"],
  })
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