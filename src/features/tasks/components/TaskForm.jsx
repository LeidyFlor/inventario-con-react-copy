import { Input, Button, IconButton, Select } from "@/shared"
import React, { useState, useEffect } from "react";
import { getUserTypes, getTaskState, getUserName } from "@/features/tasks/services/selectService";
import { tasksSchema } from "../schemas/tasksSchema";
import { Settings, Pencil } from "lucide-react";
import { tasks } from "../data/tasks";

export default function TaskForm() {
    const [formData, setFormData] = useState({
        userType: "",           
        taskName: "",            
        taskDescription: "",     
        taskState: "",           
        taskDateStart: "",       
        taskDateEnd: "",         
        userName: "",            
    });

    const [errors, setErrors] = useState({});
    const [userTypes, setUserTypes] = useState([]);
    const [taskState, setTaskState] = useState([]);
    const [userName, setUserNameState] = useState([]);
    const [displayedTasks, setDisplayedTasks] = useState(tasks);

    useEffect(() => {
        getUserTypes().then(setUserTypes);
        getTaskState().then(setTaskState);
        getUserName().then(setUserNameState);
        // Inicializar tarjetas
        setDisplayedTasks(tasks);
    }, []); // [] → sin dependencias, se ejecuta solo una vez
    
    // Filtrar tareas según usuario o tipo de usuario seleccionado
    useEffect(() => {
        let filtered = tasks;
        
        if (formData.userName) {
            filtered = filtered.filter(task => task.userName === formData.userName);
        }
        
        if (formData.userType) {
            filtered = filtered.filter(task => task.userType === formData.userType);
        }
        
        setDisplayedTasks(filtered);
    }, [formData.userName, formData.userType]);

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

    return (
        <div className="w-full flex justify-center relative">

            {/* Layout responsivo: en móvil una columna; en lg mantiene columna fija + contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-3 w-full max-w-5xl mx-auto px-4">

                {/* Columna izquierda — Formulario*/}
                <form className="flex flex-col items-center lg:items-start gap-4 w-full sm:w-80 mx-auto lg:mx-0" onSubmit={handleSubmit} noValidate>

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
                    />

                    <Select
                        label="Seleccione tipo de usuario"
                        name="userType"
                        options={userTypes}
                        value={formData.userType}
                        onChange={handleChange}
                        error={errors.userType}
                    />

                    <div className="flex gap-6 flex-wrap justify-center lg:justify-start">
                        <Button variant="primary" size="sm">Nuevo grupo</Button>
                        <Button variant="primary" size="sm">Nueva marca</Button>
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
                    />

                    <Input
                        label="Descripción de la tarea"
                        placeholder="Descripción de la tarea"
                        name="taskDescription"
                        value={formData.taskDescription}
                        onChange={handleChange}
                        error={errors.taskDescription}
                    />

                    <Select
                        label="Estado tarea"
                        name="taskState"
                        options={taskState}
                        value={formData.taskState}
                        onChange={handleChange}
                        error={errors.taskState}
                    />

                    {/* Fechas: se usa type="date" para que el navegador muestre el selector de fecha */}
                    <div className="flex flex-row gap-2 sm:gap-3 w-full justify-between sm:justify-start">
                        <Input
                            placeholder="DD/MM/AAAA"
                            type="date"
                            name="taskDateStart"
                            label="Fecha inicio"
                            className="shrink-0"
                            labelInside
                            value={formData.taskDateStart}
                            onChange={handleChange}
                            error={errors.taskDateStart}
                        />
                        <Input
                            placeholder="DD/MM/AAAA"
                            type="date"
                            name="taskDateEnd"
                            label="Fecha Fin"
                            className="shrink-0"
                            labelInside
                            value={formData.taskDateEnd}
                            onChange={handleChange}
                            error={errors.taskDateEnd}
                        />
                    </div>

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

                <div className="flex flex-col gap-4">

                    {/* Título */}
                    <div className="flex flex-col items-center max-w-max mx-auto mb-2">
                        <div className="flex items-center gap-2 pb-0.5">
                            <Settings size={30} className="text-gradient-title" />
                            <h1 className="text-gradient-title text-h2">Gestión de tareas</h1>
                        </div>
                        <div className="h-0.5 bg-gradiant-title-line w-full"></div>
                    </div>

                    {/* Contenedor de tarjetas con scroll */}
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-150 w-full">
                        {displayedTasks && displayedTasks.length > 0 ? (
                            displayedTasks.map((task) => {

                                // Color dinámico según estado
                                const stateColor = {
                                    "Pendiente":   "text-text-muted",
                                    "En progreso": "text-warning",
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
                                   <div key={task.id} className="flex flex-col md:flex-row w-full rounded-2xl overflow-hidden border-2 border-primary-300 bg-color-background min-h-40">

                                        <div className="flex flex-col gap-2 p-4 bg-primary-50 md:w-[45%] w-full justify-start">
                                            <h3 className="font-bold text-base to-background-image-text-gradient">
                                                Tarea: {task.taskName}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-pri">Estado:</span>
                                                <span className={`text-sm font-medium ${stateColor}`}>
                                                    {task.taskState}
                                                </span>
                                                <Pencil size={14} className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-text-color-secondary">Fecha inicio: {formatDate(task.taskDateStart)}</span>
                                                <Pencil size={14} className="cursor-pointer" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-color-text-secondary">Fecha Fin: {formatDate(task.taskDateEnd)}</span>
                                                <Pencil size={14} className="cursor-pointer" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 p-4 md:w-[55%] w-full bg-color-background">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-text-primary">Descripción:</span>
                                                <Pencil size={14} className="text-color-text-muted cursor-pointer" />
                                            </div>
                                            <p className=" text-sm overflow-y-auto max-h-20">
                                                {task.taskDescription}
                                            </p>
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
        </div>
    );
}
