import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button, Input, Select, IconButton, Textarea, Alert } from "@/shared";
import { tasksSchema } from "../schemas/tasksSchema";
import { updateTask } from "../services/taskService";

export default function TaskEditModal({
    isOpen,
    onClose,
    task,
    userTypes,
    userNames,
    taskStates,
    onSave,
}) {
    // Los datos vienen del backend en snake_case; los mapeamos a camelCase para el formulario
    const [formData, setFormData] = useState(() => ({
        userName:        task?.user  ? String(task.user)  : "",
        userType:        task?.group ? String(task.group) : "",
        taskName:        task?.task_name        ?? "",
        taskDescription: task?.task_description ?? "",
        taskState:       task?.task_state       ?? "",
        taskDateStart:   task?.task_date_start  ?? "",
        taskDateEnd:     task?.task_date_end     ?? "",
    }));
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);

    if (!isOpen || !task) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setIsDirty(true);
        setFormData((prev) => {
            const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
            // Exclusión mutua: seleccionar usuario limpia grupo y viceversa
            if (name === "userName" && value) updated.userType = "";
            if (name === "userType" && value) updated.userName = "";
            return updated;
        });
    };

    const handleClose = async () => {
        if (isDirty) {
            const result = await Alert.warning(
                "¿Salir sin guardar?",
                "Los cambios no guardados se perderán"
            );
            if (!result.isConfirmed) return;
        }
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = tasksSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        // Convierte Date → YYYY-MM-DD para el backend
        const toDateStr = (d) => {
            if (!d) return null
            if (d instanceof Date) return d.toISOString().slice(0, 10)
            return String(d).slice(0, 10)
        }

        const body = {
            task_name:        result.data.taskName,
            task_description: result.data.taskDescription,
            task_state:       result.data.taskState,
            task_date_start:  toDateStr(result.data.taskDateStart),
            task_date_end:    toDateStr(result.data.taskDateEnd),
        }
        if (result.data.userName) body.user  = result.data.userName
        if (result.data.userType) body.group = result.data.userType

        try {
            Alert.loading("Guardando cambios...")
            const updated = await updateTask(task.id, body)
            Alert.close()
            await Alert.success("Tarea actualizada", "Los cambios fueron guardados exitosamente")
            onSave(updated)
        } catch (error) {
            Alert.close()
            try {
                const parsed = JSON.parse(error.message)
                const msg = Object.values(parsed).flat()[0] ?? "No se pudieron guardar los cambios."
                Alert.error("Error al guardar", msg)
            } catch {
                Alert.error("Error al guardar", "No se pudieron guardar los cambios.")
            }
        }
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
                            label="Grupo"
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

                    <Textarea
                        label="Descripción de la tarea"
                        name="taskDescription"
                        value={formData.taskDescription}
                        onChange={handleChange}
                        error={errors.taskDescription}
                    />

                    <div className="flex flex-row items-center justify-between gap-3 mt-4">
                        <Button variant="secondary" size="md" type="button" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <IconButton variant="primary" size="md" type="submit">
                            Guardar
                        </IconButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
