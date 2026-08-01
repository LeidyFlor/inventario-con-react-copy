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

export const userShema = z
  .object({
    First_name: z
      .string()
      .min(3, "El nombre debe de tener mínimo 3 caracteres")
      .max(60, "El nombre es demasiado largo"),

    Last_name: z
      .string()
      .min(3, "El apellido debe de tener mínimo 3 caracteres")
      .max(60, "El apellido es demasiado largo"),

    userEmail: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email válido")
      .regex(
        /^((?!(soy\.)?sena\.edu\.co).)*$/,
        "El correo debe ser el personal",
      ),

    userEmailConfir: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email válido")
      .optional() //para campos opcionales
      .or(z.literal("")),

    userEmail2: z
      .string()
      .regex(
        /^[a-zA-Z0-9._%+-]+@(soy\.)?sena\.edu\.co$/,
        "Debe ingresar un email institucional",
      )
      .optional() //para campos opcionales
      .or(z.literal("")),

    userTel: z
      .string()
      .regex(/^[0-9]{10}$/, "El telefono debe tener 10 dígitos"),

    userTel2: z
      .string()
      .regex(/^[0-9]{10}$/, "El telefono debe tener 10 dígitos")
      .optional() //para campos opcionales
      .or(z.literal("")),

    userDocumentType: z
      .string()
      .min(1, "Debe seleccionar un tipo de documento"),

    userType: z.array(z.string()).min(1, "Debe seleccionar mínimo un tipo de usuario"),

    userDocument: z
      .string()
      .min(5, "Número de documento inválido")
      .max(20, "Número de documento demasiado largo"),

    userAddres: z
      .string()
      .min(10, "La dirección es muy corta")
      .max(100, "La dirección es muy larga")
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s#\-.,]+$/,
        "La dirección contiene caracteres no válidos",
      ),

    userDateStart: datePreprocess(
      "La fecha de inicio es obligatoria",
      "Fecha de inicio inválida",
    ),
    userDateEnd: datePreprocess(
      "La fecha fin es obligatoria",
      "Fecha de fin inválida",
    ),
    // Estos dos deben estar declarados aunque no tengan validación: Zod
    // ELIMINA las claves que no aparecen en el esquema, y a createUser se le
    // pasa result.data (la salida de Zod), no el estado del formulario. Sin
    // esta línea llegaban como undefined y se guardaban siempre en false.
    is_accountant: z.boolean().default(false),
    is_staff: z.boolean().default(false),
    //acepta array vacio, lleno o undefined
    userImage: z.array(z.instanceof(File)).optional(),
  })
  //para que email y confirmación sean iguales
  .refine((data) => data.userEmail === data.userEmailConfir, {
    message: "Los correos no coinciden",
    path: ["userEmailConfir"], //donde se muestra el error
  })
  //para que los teléfonos no sean iguales
  .refine((data) => !data.userTel || data.userTel !== data.userTel2, {
    message: "Los teléfonos no pueden ser iguales",
    path: ["userTel2"],
  })
  //Valida que la fecha fin no sea antes que la de inicio
  .refine(
    (data) => {
      if (!data.userDateEnd || !data.userDateStart) return true; //si alguna de las fechas es nula, se debe activar el error de fecha inválida
      return data.userDateEnd >= data.userDateStart;
    },
    {
      message: "La fecha fin no puede ser anterior a la fecha de inicio",
      path: ["userDateEnd"],
    },
  );

