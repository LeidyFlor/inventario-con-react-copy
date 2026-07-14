import { Input, Textarea, IconButton, Button } from "@/shared";
import { useState } from "react";
import { FileText } from "lucide-react";
import { taskModalSchema } from "../schemas/taskModalSchema";

export default function TaskCreateModal({ onClose, onTaskCreated }) {
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

    const handleSubmit = (e) => {
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
        onTaskCreated?.(result.data);
        onClose();
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

                <div className="flex justify-center mt-2">
                    <IconButton variant="primary" size="md" type="submit">
                        Aceptar
                    </IconButton>
                </div>
            </form>
        </div>
    );
}
