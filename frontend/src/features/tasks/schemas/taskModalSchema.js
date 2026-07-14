import { z } from "zod";

/*
  Schema para el modal de creación de tarea (TaskCreateModal).
  Se usa tanto desde el perfil de usuario (ViewUserPage)
  como desde el formulario de registro (UserRegisterForm).
 
  No incluye usuario/grupo ni estado porque en estos contextos
  la tarea se asocia al usuario en cuestión y el estado
  lo maneja el backend con un valor por defecto.
 
  La tarea es opcional: el usuario puede no abrir el modal.
  Pero si lo abre y envía, todos los campos son obligatorios.
 */
export const taskModalSchema = z
    .object({
        taskName: z
            .string()
            .min(5, "Nombre de la tarea muy corto")
            .max(30, "Título de la tarea muy largo"),

        taskDescription: z
            .string()
            .min(5, "Es requerida una descripción de la tarea")
            .max(254, "Descripción de la tarea muy larga"),

        taskDateStart: z
            .string()
            .min(1, "La fecha de inicio es obligatoria"),

        taskDateEnd: z
            .string()
            .min(1, "La fecha fin es obligatoria"),
    })
    .refine(
        (data) => {
            if (!data.taskDateEnd || !data.taskDateStart) return true;
            return data.taskDateEnd >= data.taskDateStart;
        },
        {
            message: "La fecha fin no puede ser anterior a la fecha de inicio",
            path: ["taskDateEnd"],
        },
    );
