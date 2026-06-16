import { z } from "zod";

export const loginEmailSchema = z
  .object({
    userEmail: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ingresar un email válido")
      .regex(
        /^((?!(soy\.)?sena\.edu\.co).)*$/,
        "El correo debe ser el personal",
      )
  });
