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
    z.date().nullable().superRefine((val, ctx) => {
      if (val === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: mensajeError,
        });
      }
    }),
  );

export const tasksSchema = z
  .object({
    userType: z
    .string()
    .max(1, "Solo se puede elegir un tipo de usuario"),

    userName: z
    .string()
    .max(1, "Solo se puede elegir un usuario individual"),

    taskName: z
      .string()
      .min(5, "Nombre de la tarea muy corto")
      .max(30, "Título de la tarea muy larga"),
    descripcionTarea: z
      .string()
      .min(5, "Es requerida una descripción de la tarea")
      .max(100, "Descripción de la tarea muy larga"),

    estadoTarea: z
    .string()
    .min(1, "Debe seleccionar un estado para la tarea"),

    taskDateStart: datePreprocess(
      "La fecha de inicio es obligatoria",
      "Fecha de inicio inválida",
    ),

    taskDateEnd: datePreprocess(
      "La fecha fin es obligatoria",
      "Fecha de fin inválida",
    ),
  })
  //Valida que la fecha fin no sea antes que la de inicio
  .refine(
    (data) => {
      if (!data.taskDateEnd || !data.taskDateStart) return true; //si alguna de las fechas es nula, se debe activar el error de fecha inválida
      return data.taskDateEnd >= data.taskDateStart;
    },
    {
      message: "La fecha fin no puede ser anterior a la fecha de inicio",
      path: ["taskDateEnd"],
    },
  )
  .superRefine((data, ctx) => {
  if (!data.userName && !data.userType) {
    const message = "Tipo de usuario o usuario individual debe ser seleccionado";
    //para que se muestre el mensaje de error en los dos campos
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
      path: ["userName"],
    });

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message,
      path: ["userType"],
    });
  }
});
  