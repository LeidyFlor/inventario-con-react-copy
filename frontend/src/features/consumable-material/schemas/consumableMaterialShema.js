import { z } from "zod";

export const consumableMaterialShema = z.object({
  materialBarcodeSena: z
    .string()
    .min(10, "La placa Sena debe de tener mas de 10 caractéres")
    .max(20, "La placa debe de tener máximo 20 caractéres"),

  brandName: z
  .string()
  .min(1, "Debe seleccionar una marca"),

  inventoryManger: z
  .string()
  .min(1, "Debe seleccionar un cuentadante"),

  materialDescription: z
    .string()
    .max(500, "Descripción demasiado larga")
    .optional() //para campos opcionales
    .or(z.literal("")),

  materialState: z
  .string()
  .min(1, "Debe seleccionar un estado"),

  materialName: z
    .string()
    .min(
      2,
      "El nombre del materrial no puede estar vacío, mínimo 2 caractéres ",
    )
    .max(150, "Nombre del material muy largo"),

  materialQuantity: z.coerce
    .number({
      invalid_type_error: "Debe ser un número",
    })
    .positive("El número debe ser positivo") // Valida que sea > 0
    .int("Debe ser un número entero")
    .min(1, "El valor mínimo debe ser 1")
    .max(99999999999, "La cantidad no puede superar los 11 dígitos"),

  materialUnitPrice: z.coerce
    .number({
      invalid_type_error: "Debe ser un número",
    })
    .nonnegative("El valor unitario no puede ser negativo")
    .min(1, "El material debe tener valor unitario positivo"),

  materialTotalPrice: z.coerce //zod convierte string a numero
    .number({
      invalid_type_error: "Debe ser un número",
    })
    .nonnegative("El valor total no puede ser negativo") // Valida que sea => 0
    .min(1, "El material debe tener valo positivo")
    .max(9999999999, "La cantidad no puede superar los 10 dígitos"),

  materialLocation: z
  .string()
  .max(150, "Resuma la ubicación del material"),
});