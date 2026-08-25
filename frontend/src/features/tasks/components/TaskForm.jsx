import { Input, Button, IconButton, Select, Alert, Textarea } from "@/shared"
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserTypes, getTaskState, getUserName } from "@/features/tasks/services/selectService";
import { tasksSchema } from "../schemas/tasksSchema";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import TaskEditModal from "./TaskEditModal";
import { createTask, getTasks } from "@/features/tasks/services/taskService";
import { GroupCreateModalPage } from "@/features/groups";

// Cuantas cards se muestran por pagina en la columna derecha
const CARDS_PER_PAGE = 2;

export default function TaskForm() {
    const navigate = useNavigate();
    // Modal para crear grupo al vuelo, mismo patrón que UserRegisterForm
    const [groupModalOpen, setGroupModalOpen] = useState(false);
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
    const [taskList, setTaskList] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    // Página actual de la lista de cards; se reinicia cuando cambia el filtro
    const [currentPage, setCurrentPage] = useState(0);

    // Carga los datos de los selects solo una vez al montar el componente
    // Estos datos sirven para mostrar las opciones de usuario, tipo de usuario
    // y estado de tarea en los campos del formulario.
    useEffect(() => {
        // Los servicios ya devuelven { label, value } con el ID correcto
        getUserTypes().then(setUserTypes).catch(console.error);
        getTaskState().then(setTaskState).catch(console.error);
        getUserName().then(setUserNameState).catch(console.error);
        // Carga todas las tareas existentes al montar el componente
        getTasks().then(setTaskList).catch(console.error);
    }, []);

    // Tareas a mostrar en pantalla según el filtro de usuario o grupo.
    // Las tareas del backend incluyen los campos `user` (id) y `group` (id).
    const displayedTasks = taskList.filter((task) => {
        if (formData.userName && String(task.user) !== String(formData.userName)) return false;
        if (formData.userType && String(task.group) !== String(formData.userType)) return false;
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
        const { name, value, type, checked } = e.target;

        // Al cambiar el filtro se vuelve a la primera página para no quedar en una página inexistente
        if (name === "userName" || name === "userType") setCurrentPage(0);

        setFormData((prev) => {
            const updated = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };
            // Exclusión mutua: seleccionar usuario limpia grupo y viceversa
            if (name === "userName" && value) updated.userType = "";
            if (name === "userType" && value) updated.userName = "";
            return updated;
        });
    };

    // ==================================================
    //              Handle Submit
    // ==================================================
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

        setErrors({});

        try {
            Alert.loading("Asignando tarea...");
            const newTask = await createTask(result.data);
            Alert.close();
            await Alert.success("Tarea asignada", "La tarea fue registrada exitosamente");
            setTaskList((prev) => [...prev, newTask]);
            setCurrentPage(0);
        } catch (error) {
            Alert.close();
            // El servicio ya entrega el mensaje listo: antes aquí se
            // parseaba un JSON metido dentro del texto del error
            Alert.error("Error al asignar tarea", error.message);
        }
    };

    const handleOpenEditModal = (task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setSelectedTask(null);
        setIsEditModalOpen(false);
    };

    // updatedTask viene del backend en snake_case; reemplaza la tarea en la lista por ID
    const handleSaveTask = (updatedTask) => {
        setTaskList((prev) => prev.map((t) => t.id === updatedTask.id ? updatedTask : t));
        handleCloseEditModal();
    };

    // Etiqueta dinámica del subtítulo según la selección actual
    const assigneeLabel = (() => {
        if (formData.userName) {
            const found = userName.find(u => String(u.value) === String(formData.userName))
            return `Usuario: ${found?.label ?? "—"}`
        }
        if (formData.userType) {
            const found = userTypes.find(g => String(g.value) === String(formData.userType))
            return `Grupo: ${found?.label ?? "—"}`
        }
        return "Usuario: —"
    })()

    // Color dinámico según estado; definido fuera del map para no recrearlo en cada render
    const stateColor = {
        "pendiente":   "text-text-muted",
        "en_progreso": "text-boton-fill-color-secondary",
        "completada":  "text-success",
        "cancelada":   "text-error",
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
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 w-full max-w-7xl mx-auto px-4">

                {/* Columna izquierda — Formulario*/}
                <form className="flex flex-col items-center lg:items-start gap-1 w-80 md:w-fit mx-auto lg:mx-0" onSubmit={handleSubmit} noValidate>

                    {/* Título */}
                    <div className="flex flex-col max-w-max mx-auto">
                        <div className="flex items-center gap-2 pb-0.5">
                            <Settings className="text-brand" />
                            <h1 className="text-gradient-title text-h2">Gestión de tareas</h1>
                        </div>
                        <div className="h-0.5 bg-gradiant-title-line w-full"></div>
                    </div>

                    {/* Sección usuario — muestra la selección actual dinámicamente */}
                    <div className="flex flex-col items-center w-fit lg:self-center">
                        <h2 className="font-bold text-body mb-1">{assigneeLabel}</h2>
                        <div className="h-0.5 bg-border-line-subtitle w-[100%]"></div>
                    </div>

                    <p className="w-full text-small text-text-primary">
                        Seleccione tipo de usuario o usuario individual para asignar o consultar tareas
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
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
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("/dashboard/user-create")}
                        >
                            Nuevo usuario
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => setGroupModalOpen(true)}
                        >
                            Nuevo grupo
                        </Button>

                    </div>


                    {/* Sección agregar tarea — en tablet se muestra en 2 columnas */}
                    <div className="w-80 flex flex-col md:w-auto md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-1">

                        {/* Subtítulo — ocupa las 2 columnas en tablet */}
                        <div className="flex flex-col items-center w-fit mx-auto md:col-span-2">
                            <h2 className="font-bold text-body mb-1">Agregar tarea</h2>
                            <div className="block h-0.5 bg-border-line-subtitle w-[320%] self-center"></div>
                        </div>

                        {/* Columna 1 */}
                        <Input
                            label="Nombre de la tarea"
                            placeholder="Nombre de la tarea"
                            name="taskName"
                            value={formData.taskName}
                            onChange={handleChange}
                            error={errors.taskName}
                            required
                        />


                        {/* Columna 1 */}
                        <Select
                            label="Estado tarea"
                            name="taskState"
                            options={taskState}
                            value={formData.taskState}
                            onChange={handleChange}
                            error={errors.taskState}
                            required
                        />

                        {/* Columna 2 */}
                        <Input
                            placeholder="DD/MM/AAAA"
                            type="date"
                            name="taskDateStart"
                            label="Fecha inicio"
                            value={formData.taskDateStart}
                            onChange={handleChange}
                            error={errors.taskDateStart}
                            required
                        />

                        {/* Columna 1 */}
                        <Input
                            placeholder="DD/MM/AAAA"
                            type="date"
                            name="taskDateEnd"
                            label="Fecha Fin"
                            value={formData.taskDateEnd}
                            onChange={handleChange}
                            error={errors.taskDateEnd}
                            required
                        />
                        {/* Se le coloca rows 3 para que solo ocupe tres filas */}
                        <div className="col-span-2">
                            <Textarea
                                label="Descripción de la tarea"
                                placeholder="Descripción de la tarea"
                                name="taskDescription"
                                value={formData.taskDescription}
                                onChange={handleChange}
                                error={errors.taskDescription}
                                rows= {3}
                                required
                            />

                        </div>

                        {/* Botón — ocupa las 2 columnas en tablet */}
                        <div className="w-full flex justify-center md:justify-end md:col-span-2">
                            <IconButton
                                variant="primary"
                                size="md"
                                type="submit"
                            >
                                Asignar
                            </IconButton>
                        </div>

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
                                                    Tarea: {task.task_name}
                                                </h3>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{task.user_name ? "Usuario:" : "Grupo:"}</span>
                                                    <span className="text-sm font-medium">
                                                        {task.user_name ?? task.group_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-pri">Estado:</span>
                                                    <span className={`text-sm font-medium ${stateColor[task.task_state] ?? "text-color-text-primary"}`}>
                                                        {task.task_state}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-text-color-secondary">Fecha inicio: {formatDate(task.task_date_start)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-color-text-secondary">Fecha Fin: {formatDate(task.task_date_end)}</span>
                                                </div>
                                            </div>

                                            {/* Columna derecha: descripción */}
                                            <div className="flex flex-col gap-1 w-full bg-color-background p-2.5 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-text-primary">Descripción:</span>
                                                </div>
                                                {(() => {
                                                    const scroll = task.task_description && task.task_description.length > 20;
                                                    return (
                                                        <p className={`text-sm ${scroll ? 'overflow-y-auto max-h-16' : ''}`}>
                                                            {task.task_description}
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

            {groupModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setGroupModalOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GroupCreateModalPage
                            onClose={() => setGroupModalOpen(false)}
                            onGroupCreated={(newGroup) => {
                                // Agrega el nuevo grupo al select y lo deja seleccionado,
                                // igual que en UserRegisterForm
                                setUserTypes(prev => [...prev, newGroup])
                                setFormData(prev => ({
                                    ...prev,
                                    userType: String(newGroup.value),
                                    userName: "", // exclusión mutua con usuario
                                }))
                                setGroupModalOpen(false)
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
