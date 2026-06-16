import { z } from "zod";

export const loginCodeSchema = z.object({
  userCode: z
    .string()
    //será de 6 números aleatorios
    .min(6, "Contraseña debe de tener 6 caracteres")
    .max(6, "Contraseña debe de tener 6 caracteres")
});
