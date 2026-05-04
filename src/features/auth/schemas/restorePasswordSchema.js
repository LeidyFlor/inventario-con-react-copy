import {z} from "zod";

export const restorePasswordSchema = z
  .object({
    userPassword: z
      .string()
      .min(8, "Contraseña debe tener mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
    userPasswordConfir: z.string().min(8, "Debe confirmar la contraseña"),
  })
  .refine((data) => data.userPassword === data.userPasswordConfir, {
    // Cambiado a ===
    message: "Las contraseñas no coinciden",
    path: ["userPasswordConfir"],
  });
