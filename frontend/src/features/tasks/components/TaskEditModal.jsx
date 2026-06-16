import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button, Input, Select, IconButton, Textarea } from "@/shared";
import { tasksSchema } from "../schemas/tasksSchema";

export default function TaskEditModal({
    isOpen,
    onClose,
    task,
    userTypes,
    userNames,
    taskStates,
    onSave,
}) {
    // Inicializamos el formulario con los valores de la tarea seleccionada.
    // Este estado se toma solo cuando el componente se monta, por eso el modal se fuerza
    // a remontar desde `TaskForm` usando una `key` basada en la tarea seleccionada.
    const [formData, setFormData] = useState(() => ({
        userName: task?.userName ?? "",
        userType: task?.userType ?? "",
        taskName: task?.taskName ?? "",
        taskDescription: task?.taskDescription ?? "",
        taskState: task?.taskState ?? "",
        taskDateStart: task?.taskDateStart ? task.taskDateStart.slice(0, 10) : "",
        taskDateEnd: task?.taskDateEnd ? task.taskDateEnd.slice(0, 10) : "",
    }));
    const [errors, setErrors] = useState({});

    // Si el modal está cerrado o no hay tarea, no renderizamos nada.
    if (!isOpen || !task) return null;

    // Actualiza los valores del formulario cuando el usuario edita campos.
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const result = tasksSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                fieldErrors[field] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        const updatedTask = {
            ...task,
            ...result.data,
            taskDateStart: result.data.taskDateStart.toISOString(),
            taskDateEnd: result.data.taskDateEnd.toISOString(),
        };

        onSave(updatedTask);
    };

    return (
        
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-background p-6 shadow-2xl">
                <div className="flex flex-col items-start gap-2 mb-6 max-w-max">
                    <div className="flex items-center gap-2 pb-0.5">
                        <Pencil className="text-brand"/>
                        <h2 className="text-gradient-title text-h2">Editar tarea</h2>
                    </div>
                    <div className="h-0.5 bg-gradiant-title-line w-full"></div>
                </div>

                <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Usuario"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            options={userNames}
                            error={errors.userName}
                            variant="isEdit"
                        />
                        <Select
                            label="Tipo de usuario"
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            options={userTypes}
                            error={errors.userType}
                            variant="isEdit"
                        />
                        <Select
                            label="Estado tarea"
                            name="taskState"
                            value={formData.taskState}
                            onChange={handleChange}
                            options={taskStates}
                            error={errors.taskState}
                            variant="isEdit"
                        />

                        <Input
                            label="Nombre de la tarea"
                            name="taskName"
                            value={formData.taskName}
                            onChange={handleChange}
                            error={errors.taskName}
                            variant="isEdit"
                        />

                        {/* Fechas: centradas horizontalmente, inputs uno al lado del otro */}
                        <div className="col-span-2 flex justify-center gap-4">
                            <Input
                                label="Fecha inicio"
                                type="date"
                                name="taskDateStart"
                                value={formData.taskDateStart}
                                onChange={handleChange}
                                error={errors.taskDateStart}
                                className="w-40"
                                variant="isEdit"
                            />
                            <Input
                                label="Fecha Fin"
                                type="date"
                                name="taskDateEnd"
                                value={formData.taskDateEnd}
                                onChange={handleChange}
                                error={errors.taskDateEnd}
                                className="w-40"
                                variant="isEdit"
                            />
                        </div>
                    </div>

                    <div>
                        <Textarea
                            label="Descripción de la tarea"
                            name="taskDescription"
                            value={formData.taskDescription}
                            onChange={handleChange}
                            error={errors.taskDescription}
                        />
                    </div>

                    <div className="flex flex-row items-center justify-between gap-3 mt-4">
                        <div className="w-fit">
                            <Button variant="secondary" size="md" type="button" onClick={onClose}>
                                Cancelar
                            </Button>
                        </div>
                        <div className="w-fit">
                            <IconButton variant="primary" size="md" type="submit">
                                Guardar
                            </IconButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
