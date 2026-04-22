import { z } from "zod";

export const userShema = z
  .object({
    userName: z
      .string()
      .min(3, "El nombre debe de tener mínimo 3 caracteres")
      .max(60, "El nombre es demasiado largo"),

    userEmail: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email válido")
      .regex(/^((?!(soy\.)?sena\.edu\.co).)*$/, "El correo debe ser personal"),

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

    userType: z.string().min(1, "Debe seleccionar un tipo de usuario"),

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

    userPassword: z
      .string()
      .min(8, "Contraseña debe de tener mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un caractér especial"),
  })
  //para que email y confirmación sean iguales
  .refine((data) => data.userEmail === data.userEmailConfir, {
    message: "Los correos no coinciden",
    path: ["userEmailConfir"], //donde se muestra el error
  })
  //para que los teléfonos no sean iguales
  .refine((data) => data.userTel === data.userTel2, {
    message: "Los teléfonos no pueden ser iguales",
    path: ["userTel2"],
  });

