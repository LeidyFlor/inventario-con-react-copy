import { Input, Textarea, IconButton, Button, Alert } from "@/shared";
import { useState } from "react";
import { FileText } from "lucide-react";
import { taskModalSchema } from "../schemas/taskModalSchema";

/**
 * Modal para crear una tarea.
 *
 * Props:
 *   onClose       — cierra el modal
 *   onTaskCreated — callback con los datos validados
 *                   · deferred=true  → síncrono, el padre guarda en estado
 *                   · deferred=false → debe ser async y lanzar en caso de error
 *   deferred      — true cuando la tarea se guarda en estado y se envía junto
 *                   con otro recurso (ej: creación de usuario)
 */
export default function TaskCreateModal({ onClose, onTaskCreated, deferred = false }) {
    const [taskData, setTaskData] = useState({
        taskName: "",
        taskDescription: "",
        taskDateStart: "",
        taskDateEnd: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = taskModalSchema.safeParse(taskData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});

        // Modo diferido: sólo pasa los datos al padre (se enviarán junto con el usuario)
        if (deferred) {
            onTaskCreated?.(result.data);
            onClose();
            return;
        }

        // Modo inmediato: llama al backend directamente
        try {
            Alert.loading("Creando tarea...");
            await onTaskCreated?.(result.data);
            Alert.close();
            await Alert.success("Tarea creada", "La tarea fue registrada exitosamente");
            onClose();
        } catch (error) {
            Alert.close();
            Alert.error("Error al crear tarea", error.message);
        }
    };

    return (
        <div className="bg-background border-4 border-border-green-container p-6 rounded-4xl w-fit">
            <div className="flex items-start mb-4">
                <Button variant="secondary" type="button" onClick={onClose}>
                    Atrás
                </Button>
            </div>

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
                    required
                />

                <Textarea
                    placeholder="Descripción tarea"
                    name="taskDescription"
                    label="Descripción tarea"
                    value={taskData.taskDescription}
                    onChange={handleChange}
                    error={errors.taskDescription}
                    required
                />

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        type="date"
                        name="taskDateStart"
                        label="Fecha inicio"
                        value={taskData.taskDateStart}
                        onChange={handleChange}
                        error={errors.taskDateStart}
                        required
                    />
                    <Input
                        type="date"
                        name="taskDateEnd"
                        label="Fecha fin"
                        value={taskData.taskDateEnd}
                        onChange={handleChange}
                        error={errors.taskDateEnd}
                        required
                    />
                </div>

                {/* Aviso informativo solo en modo diferido (creación junto con usuario) */}
                {deferred && (
                    <p className="text-small text-text-muted text-center">
                        La tarea se registrará al confirmar el registro del usuario.
                    </p>
                )}

                <div className="flex justify-center mt-2">
                    <IconButton variant="primary" size="md" type="submit">
                        Aceptar
                    </IconButton>
                </div>
            </form>
        </div>
    );
}
