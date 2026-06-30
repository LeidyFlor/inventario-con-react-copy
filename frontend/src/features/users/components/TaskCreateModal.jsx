import { Input, Textarea, IconButton, Button } from "@/shared";
import { z } from "zod";
import { useState } from "react";
import { FileText } from "lucide-react";

// Validación local del modal: solo los campos que realmente se piden aquí
const taskCreateSchema = z.object({
    taskName: z.string().min(5, "Nombre de la tarea muy corto").max(30, "Título de la tarea muy larga"),
    taskDescription: z.string().min(5, "Es requerida una descripción de la tarea").max(254, "Descripción de la tarea muy larga"),
    taskDateStart: z.string().min(1, "La fecha de inicio es obligatoria"),
    taskDateEnd: z.string().min(1, "La fecha fin es obligatoria"),
    
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
;

// Modal que se abre desde el botón Agregar tarea en UserRegisterForm
export default function TaskCreateModal({ onClose, onTaskCreated }) {
    const [taskData, setTaskData] = useState({
        taskName: "",
        taskDescription: "",
        taskDateStart: "",
        taskDateEnd: "",
        userTel: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

    const result = taskCreateSchema.safeParse(taskData);

        // Si la validación falla
        if (!result.success) {
            const fieldErrors = {};

            // Zod devuelve los errores en un arreglo llamado "issues"
            // Se recorren para asociar cada error a su campo correspondiente
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];

                // Se guarda el mensaje de error en el objeto fieldErrors
                fieldErrors[field] = issue.message;
            });

            // Se actualiza el estado de errores para mostrarlos en el formulario
            setErrors(fieldErrors);

            // Se detiene la ejecución porque el formulario tiene errores
            return;
        }

        // Si la validación es exitosa se limpian los errores anteriores
        setErrors({});

        // result.data contiene los datos ya validados por Zod
        onTaskCreated?.(result.data);
        onClose();
    };

    return (
        <div className="bg-background border-4 border-border-green-container p-6 rounded-4xl w-fit">
            <div className="flex items-start mb-4">
                <Button
                    variant="secondary"
                    type="button"
                    onClick={onClose}
                >
                    Atrás
                </Button>
            </div>
            {/* Contenedor del título y la línea, igual al de UserRegisterForm */}
            <div className="mb-4 max-w-max">
                <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                    <FileText className="text-brand" />
                    Agregar tarea
                </h1>
                <div className="h-0.5 bg-gradiant-title-line"></div>
            </div>


            <form className="flex flex-col gap-3 w-full max-w-sm mx-auto" onSubmit={handleSubmit} noValidate>
                <Input
                    placeholder="Nombre tarea"
                    name="taskName"
                    label="Nombre tarea"
                    value={taskData.taskName}
                    onChange={handleChange}
                    error={errors.taskName}
                />

                <Textarea
                    placeholder="Descripción tarea"
                    name="taskDescription"
                    label="Descripción tarea"
                    value={taskData.taskDescription}
                    onChange={handleChange}
                    error={errors.taskDescription}
                />

                {/* Fechas en una fila, igual que en UserRegisterForm */}
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        type="date"
                        name="taskDateStart"
                        label="Fecha inicio"
                        value={taskData.taskDateStart}
                        onChange={handleChange}
                        error={errors.taskDateStart}
                    />
                    <Input
                        type="date"
                        name="taskDateEnd"
                        label="Fecha fin"
                        value={taskData.taskDateEnd}
                        onChange={handleChange}
                        error={errors.taskDateEnd}
                    />
                </div>

                <div className="flex justify-center mt-2">
                    <IconButton
                        variant="primary"
                        size="md"
                        type="submit"
                    >
                        Aceptar
                    </IconButton>
                </div>
            </form>
        </div>
    );
}
