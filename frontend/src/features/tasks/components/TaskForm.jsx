import { Input, Button, IconButton, Select } from "@/shared"
import { useState, useEffect } from "react";
import { getUserTypes, getTaskState, getUserName } from "@/features/tasks/services/selectService";
import { tasksSchema } from "../schemas/tasksSchema";
import { Settings, Pencil } from "lucide-react";
import { tasks } from "../data/tasks";
import TaskEditModal from "./TaskEditModal";

export default function TaskForm() {
    const [formData, setFormData] = useState({
        userName: "",            
        userType: "",           
        taskName: "",            
        taskDescription: "",     
        taskState: "",           
        taskDateStart: "",       
        taskDateEnd: "",         
    });
    const [errors, setErrors] = useState({});
    const [userTypes, setUserTypes] = useState([]);
    const [taskState, setTaskState] = useState([]);
    const [userName, setUserNameState] = useState([]);
    const [taskList, setTaskList] = useState(tasks);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Carga los datos de los selects solo una vez al montar el componente.
    // Estos datos sirven para mostrar las opciones de usuario, tipo de usuario
    // y estado de tarea en los campos del formulario.
    useEffect(() => {
        getUserTypes().then((data) => setUserTypes(data.map((item) => ({ label: item.label, value: item.label }))));
        getTaskState().then((data) => setTaskState(data.map((item) => ({ label: item.label, value: item.label }))));
        getUserName().then((data) => setUserNameState(data.map((item) => ({ label: item.label, value: item.label }))));
    }, []);

    // Tareas a mostrar en pantalla según el filtro de usuario y tipo de usuario.
    // No usamos useMemo aquí para que quede más simple y fácil de entender.
    const displayedTasks = taskList.filter((task) => {
        if (formData.userName && task.userName !== formData.userName) return false;
        if (formData.userType && task.userType !== formData.userType) return false;
        return true;
    });

    const handleChange = (e) => {
        // Se obtiene el nombre del campo y su valor
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            // Se copian todos los valores anteriores del estado
            ...prev,
            // Se actualiza únicamente el campo que cambió
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // ==================================================
    //              Handle Submit
    // ==================================================
    /*
        Se ejecuta cuando el usuario envía el formulario.
    */
    const handleSubmit = (e) => {
        e.preventDefault();

        // safeParse valida el objeto formData según el esquema Zod
        // Devuelve { success: true, data } o { success: false, error }
        const result = tasksSchema.safeParse(formData);

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
        console.log("Usuario valido:", result.data);
    };

    const handleOpenEditModal = (task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setSelectedTask(null);
        setIsEditModalOpen(false);
    };

    const handleSaveTask = (updatedTask) => {
        setTaskList((prev) => prev.map((task) => task.id === updatedTask.id ? updatedTask : task));
        handleCloseEditModal();
    };

    return (
        <div className="w-full flex justify-center relative">

            {/* Layout responsivo: en móvil una columna; en lg mantiene columna fija + contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-3 w-full max-w-7xl mx-auto px-4">

                {/* Columna izquierda — Formulario*/}
                <form className="flex flex-col items-center lg:items-start gap-4 w-full sm:w-80 mx-auto lg:mx-0" onSubmit={handleSubmit} noValidate>

                    {/* Título */}
                    <div className="flex flex-col max-w-max mx-auto mb-2">
                        <div className="flex items-center gap-2 pb-0.5">
                            <Settings size={24} className="text-brand" />
                            <h1 className="text-gradient-title text-h2">Gestión de tareas</h1>
                        </div>
                        <div className="h-0.5 bg-gradiant-title-line w-full"></div>
                    </div>

                    {/* Sección usuario  */}
                    <div className="flex flex-col items-center w-fit lg:self-center">
                        <h2 className="font-bold text-body mb-2">Usuario: Pepito Perez</h2>
                        {/* Línea verde con width al 200% para que se extienda más allá del título y quede más estético */}
                        <div className="h-0.5 bg-border-line-subtitle w-[200%]"></div>
                    </div>

                    <p className="w-full sm:w-80 text-small text-text-primary">
                        Seleccione tipo de usuario o usuario individual para asignar o consultar tareas
                    </p>

                    <Select
                        label="Seleccione usuario"
                        name="userName"
                        options={userName}
                        value={formData.userName}
                        onChange={handleChange}
                        error={errors.userName}
                        required
                    />

                    <Select
                        label="Seleccione tipo de usuario"
                        name="userType"
                        options={userTypes}
                        value={formData.userType}
                        onChange={handleChange}
                        error={errors.userType}
                        required
                    />

                    <div className="flex gap-6 flex-wrap justify-center lg:justify-start">
                        <Button variant="primary" size="sm">Nuevo grupo</Button>
                        <Button variant="primary" size="sm">Nuevo usuario</Button>
                    </div>

                    {/* Sección agregar tarea */}
                    <div className="flex flex-col items-center w-fit lg:self-center">
                        <h2 className="font-bold text-body mb-2">Agregar tarea</h2>
                        {/* Línea verde con width al 320% para que se extienda más allá del título y quede más estético */}
                        <div className="block h-0.5 bg-border-line-subtitle w-[320%]"></div>
                    </div>

                    <Input
                        label="Nombre de la tarea"
                        placeholder="Nombre de la tarea"
                        name="taskName"
                        value={formData.taskName}
                        onChange={handleChange}
                        error={errors.taskName}
                        required
                    />

                    <Input
                        label="Descripción de la tarea"
                        placeholder="Descripción de la tarea"
                        name="taskDescription"
                        value={formData.taskDescription}
                        onChange={handleChange}
                        error={errors.taskDescription}
                        required
                    />

                    <Select
                        label="Estado tarea"
                        name="taskState"
                        options={taskState}
                        value={formData.taskState}
                        onChange={handleChange}
                        error={errors.taskState}
                        required
                    />
                    
                        <Input
                            placeholder="DD/MM/AAAA"
                            type="date"
                            name="taskDateStart"
                            label="Fecha inicio"
                            className="shrink-0"
                            value={formData.taskDateStart}
                            onChange={handleChange}
                            error={errors.taskDateStart}
                            required
                        />
                        <Input
                            placeholder="DD/MM/AAAA"
                            type="date"
                            name="taskDateEnd"
                            label="Fecha Fin"
                            className="shrink-0"
                            value={formData.taskDateEnd}
                            onChange={handleChange}
                            error={errors.taskDateEnd}
                            required
                        />


                    <div className="w-full flex justify-center">
                        <IconButton
                            variant="primary"
                            size="md"
                            type="submit"
                        >
                            Asignar
                        </IconButton>
                    </div>

                </form>

                {/*Columna derecha — Tarjetas de tareas*/}

                <div className="w-full flex flex-col gap-2 h-auto overflow-y-visible lg:h-0 lg:min-h-full">

                    {/* Contenedor de tarjetas con scroll */}
                    <div className="flex flex-col gap-2 overflow-y-auto w-full flex-1 min-h-0 pr-1">
                        {displayedTasks && displayedTasks.length > 0 ? (
                            displayedTasks.map((task) => {

                                // Color dinámico según estado
                                const stateColor = {
                                    "Pendiente":   "text-text-muted",
                                    "En progreso": "text-boton-fill-color-secondary",
                                    "Completada":  "text-success",
                                    "Cancelada":   "text-error",
                                }[task.taskState] ?? "text-color-text-primary";

                                // Formatea fecha ISO a DD/MM/AAAA
                                const formatDate = (iso) => {
                                    const d = new Date(iso);
                                    return d.toLocaleDateString("es-CO", {
                                        day: "2-digit", month: "2-digit", year: "numeric"
                                    });
                                };

                                return (
                                   <div key={task.id} className="flex flex-col w-full rounded-2xl border-2 border-primary-300 bg-surface p-4 gap-4">

                                        <div className="grid grid-cols-1 md:grid-cols-[45%_55%] gap-4 items-start">
                                            {/* Columna izquierda: título + fechas */}
                                            <div className="flex flex-col gap-2 bg-primary-50 w-full p-3 rounded-xl">
                                                <h3 className="font-bold text-base to-background-image-text-gradient">
                                                    Tarea: {task.taskName}
                                                </h3>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">Usuario:</span>
                                                    <span className="text-sm font-medium">
                                                        {task.userType}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-pri">Estado:</span>
                                                    <span className={`text-sm font-medium ${stateColor}`}>
                                                        {task.taskState}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-text-color-secondary">Fecha inicio: {formatDate(task.taskDateStart)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-color-text-secondary">Fecha Fin: {formatDate(task.taskDateEnd)}</span>
                                                </div>
                                            </div>

                                            {/* Columna derecha: descripción */}
                                            <div className="flex flex-col gap-2 w-full bg-color-background p-3 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-text-primary">Descripción:</span>
                                                </div>
                                                {(() => {
                                                    const scroll = task.taskDescription && task.taskDescription.length > 20;
                                                    return (
                                                        <p className={`text-sm ${scroll ? 'overflow-y-auto max-h-24' : ''}`}>
                                                            {task.taskDescription}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="w-full flex justify-end mt-2">
                                            <Button type="button" variant="warning" size="md" onClick={() => handleOpenEditModal(task)}>
                                                Editar
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center p-8 text-center">
                                <p className="text-text-muted">
                                    {formData.userName || formData.userType 
                                        ? "No hay tareas disponibles para la selección actual"
                                        : "Selecciona un usuario o tipo de usuario para ver sus tareas"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/*
                El key aquí fuerza que el modal se remonte cuando cambia la tarea seleccionada
                o cuando se abre/cierra. Así, el estado interno del formulario se inicializa
                siempre con los datos de la tarea que se va a editar.
            */}
            <TaskEditModal
                key={`${selectedTask?.id}-${isEditModalOpen}`}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                task={selectedTask}
                userTypes={userTypes}
                userNames={userName}
                taskStates={taskState}
                onSave={handleSaveTask}
            />
        </div>
    );
}
