import { z } from "zod";

export const loginShema = z
  .object({
    userEmail: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email válido")
      .regex(
        /^((?!(soy\.)?sena\.edu\.co).)*$/,
        "El correo debe ser el personal",
      ),

    userPassword: z
      .string()
      .min(8, "Contraseña debe de tener mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un caractér especial"),

  })
