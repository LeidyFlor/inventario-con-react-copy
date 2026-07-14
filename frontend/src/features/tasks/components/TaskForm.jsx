import { Input, Button, IconButton, Select } from "@/shared"
import { useState, useEffect } from "react";
import { getUserTypes, getTaskState, getUserName } from "@/features/tasks/services/selectService";
import { tasksSchema } from "../schemas/tasksSchema";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { tasks } from "../data/tasks";
import TaskEditModal from "./TaskEditModal";

// Cuantas cards se muestran por pagina en la columna derecha
const CARDS_PER_PAGE = 2;

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
    // Página actual de la lista de cards; se reinicia cuando cambia el filtro
    const [currentPage, setCurrentPage] = useState(0);

    // Carga los datos de los selects solo una vez al montar el componente
    // Estos datos sirven para mostrar las opciones de usuario, tipo de usuario
    // y estado de tarea en los campos del formulario.
    useEffect(() => {
        getUserTypes().then((data) => setUserTypes(data.map((item) => ({ label: item.label, value: item.label }))));
        getTaskState().then((data) => setTaskState(data.map((item) => ({ label: item.label, value: item.label }))));
        getUserName().then((data) => setUserNameState(data.map((item) => ({ label: item.label, value: item.label }))));
    }, []);

    // Tareas a mostrar en pantalla según el filtro de usuario y tipo de usuario.
    // No usamos useMemo aqui para que quede más simple y facil de entender
    const displayedTasks = taskList.filter((task) => {
        if (formData.userName && task.userName !== formData.userName) return false;
        if (formData.userType && task.userType !== formData.userType) return false;
        return true;
    });

    // Total de paginas según cuantas tareas pasen el filtro
    const totalPages = Math.ceil(displayedTasks.length / CARDS_PER_PAGE);

    // Las 3 cards que corresponden a la pagina actual
    const pagedTasks = displayedTasks.slice(
        currentPage * CARDS_PER_PAGE,
        currentPage * CARDS_PER_PAGE + CARDS_PER_PAGE
    );

    const handleChange = (e) => {
        // Se obtiene el nombre del campo y su valor
        const { name, value, type, checked } = e.target;

        // Al cambiar el filtro se vuelve a la primera página para no quedar en una página inexistente
        if (name === "userName" || name === "userType") setCurrentPage(0);

        setFormData((prev) => ({
            // Se copian todos los valores anteriores del estado
            ...prev,
            // Se actualiza unicamente el campo que cambio
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

        // Se agrega la nueva tarea al final de la lista con un ID único.
        // No se cambia de página automáticamente: el usuario permanece donde estaba.
        const newTask = {
            ...result.data,
            id: Date.now(),
        };
        setTaskList((prev) => [...prev, newTask]);
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

    // Color dinámico según estado; definido fuera del map para no recrearlo en cada render
    const stateColor = {
        "Pendiente":   "text-text-muted",
        "En progreso": "text-boton-fill-color-secondary",
        "Completada":  "text-success",
        "Cancelada":   "text-error",
    };

    // Formatea fecha ISO a DD/MM/AAAA
    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString("es-CO", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });
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
                            <Settings className="text-brand" />
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

                {/* Columna derecha — Tarjetas de tareas con paginación, sin scroll vertical */}
                <div className="w-full flex flex-col gap-3">

                    {displayedTasks.length > 0 ? (
                        <>
                            {/* Lista de cards; el padding y gap se redujeron respecto al diseño original
                                para que las 3 cards de la página actual caben sin necesidad de scroll */}
                            <div className="flex flex-col gap-3">
                                {pagedTasks.map((task) => (
                                    <div key={task.id} className="flex flex-col w-full rounded-2xl border-2 border-primary-300 bg-surface p-3 gap-2">

                                        <div className="grid grid-cols-1 md:grid-cols-[45%_55%] gap-3 items-start">
                                            {/* Columna izquierda: título + fechas */}
                                            <div className="flex flex-col gap-1 bg-primary-50 w-full p-2.5 rounded-xl">
                                                <h3 className="font-bold text-sm to-background-image-text-gradient">
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
                                                    <span className={`text-sm font-medium ${stateColor[task.taskState] ?? "text-color-text-primary"}`}>
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

                                            {/* Columna derecha: descripción; max-h reducido a la mitad del original (h-24 -> h-16)
                                                para bajar la altura total de la card */}
                                            <div className="flex flex-col gap-1 w-full bg-color-background p-2.5 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-text-primary">Descripción:</span>
                                                </div>
                                                {(() => {
                                                    const scroll = task.taskDescription && task.taskDescription.length > 20;
                                                    return (
                                                        <p className={`text-sm ${scroll ? 'overflow-y-auto max-h-16' : ''}`}>
                                                            {task.taskDescription}
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="w-full flex justify-end">
                                            <Button type="button" variant="warning" size="md" onClick={() => handleOpenEditModal(task)}>
                                                Editar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Controles de paginación; solo se muestran si hay más de una página */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-1">
                                    {/* Botón página anterior; deshabilitado en la primera página */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        disabled={currentPage === 0}
                                        className="p-1 rounded-full text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
                                    >
                                        <ChevronLeft size={28} />
                                    </button>

                                    {/* Indicador de página actual sobre el total */}
                                    <span className="text-sm text-text-muted">
                                        {currentPage + 1} / {totalPages}
                                    </span>

                                    {/* Botón página siguiente; deshabilitado en la última página */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        disabled={currentPage === totalPages - 1}
                                        className="p-1 rounded-full text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
                                    >
                                        <ChevronRight size={28} />
                                    </button>
                                </div>
                            )}
                        </>
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
