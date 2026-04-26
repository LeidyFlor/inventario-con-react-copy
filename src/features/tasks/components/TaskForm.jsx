import { Input, Button, IconButton, Select } from "@/shared"
import React, { useState, useEffect } from "react";
import { getUserTypes, getTaskState, getUserName } from "@/features/tasks/services/selectService";
import { tasksSchema } from "../schemas/tasksSchema";
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

    useEffect(() => {
            getUserTypes().then(setUserTypes);
            getTaskState().then(setTaskState);
            getUserName().then(setUserNameState);
        },
    []);
     const handleChange = (e) => {
                // Se obtiene el nombre del campo y su valor
                const { name, value } = e.target; //target es lo que viene cuando se escribe
        
                setFormData((prev) => ({
                    //Se copian todos los valores anteriores del estado
                    ...prev,
        
                    //Se actualiza unicamente lo que cambió
                    [name]: value,
                }));
            };
            // ==================================================
            //              Handle Submit
            // ==================================================
            /*
                Función que se ejecuta cuando se envía el formulario
            */
        
            const handleSubmit = (e) => {
        
                e.preventDefault();
                //Se valida el objeto formData usando el esquema definido con Zod
                // safeParse devuelve un objeto indicando si la validacion fue exitosa o no
                const result = tasksSchema.safeParse(formData);
        
                //Si la validacion falla
                if (!result.success) {
                    const fieldErrors = {};
        
                    //Zod devuelve los errores en un arreglo llamado issues
                    //se recorren para asociar cada error a su campo correspondiente
                    result.error.issues.forEach((issue) => {
                        const field = issue.path[0]
        
        
                        //Se guarda el mensaje de error en el objeto fieldErrors
                        fieldErrors[field] = issue.message;
                    });
        
                    //Se actualiza el estado de errores para mostrarlos en el formulario
                    setErrors(fieldErrors);
                    //Se detiene la ejecucion porque el formulario tiene errores
                    return;
                }
                //Si la validacion es exitosa se limpian los errores anteriores
                setErrors({});
                //result.data contiene los datos ya validados por Zod
                console.log("Usuario valido:", result.data);
            }
    return (
        <div>
            <div className="mb-4">
                <Button variant="secondary" size="sm">
                    Atrás
                </Button>
            </div>

            {/* Layout dos columnas: formulario | tarjetas */}
            <div className="grid grid-cols-2 gap-10">

                {/* Columna izquierda: usuario y formulario de tarea */}
                <form className="flex flex-col items-center gap-4" onSubmit={handleSubmit} noValidate>

                    {/* Sección usuario */}
                    <div className="flex flex-col items-center w-fit">
                        <h2 className="font-bold text-body mb-2">Usuario: Pepito Perez</h2>
                        {/* Línea verde con width al 200% para que se extienda más allá del título y quede más estético */}
                        <div className="h-0.5 bg-border-line-subtitle w-[200%]"></div>
                    </div>

                    <p className="w-80 text-small text-text-primary">Seleccione tipo de usuario o usuario individual para asignar o consultar tareas</p>

                    <Select
                        label="Seleccione tipo de usuario"
                        name="userType"
                        options={userTypes}
                        value={formData.userType}
                        onChange={handleChange}
                        error={errors.userType}
                    />
                    <Select
                        label="Seleccione usuario"
                        name="userName"
                        options={userName}
                        value={formData.userName}
                        onChange={handleChange}
                        error={errors.userName}
                    />

                    {/* Sección agregar tarea */}
                    <div className="flex flex-col items-center w-fit">
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
                    <div className="flex gap-3">
                        <Input 
                            placeholder="DD/MM/AAAA" 
                            type="date" 
                            name="taskDateStart" 
                            label = "Fecha inicio"
                            className="w-[200px]"
                            labelInside
                            value={formData.taskDateStart}
                            onChange={handleChange}
                            error={errors.taskDateStart}
                        />
                        <Input 
                            placeholder="DD/MM/AAA" 
                            type="date" 
                            name="taskDateEnd"    
                            label="Fecha Fin"
                            className="w-[200px]"
                            labelInside
                            value={formData.taskDateEnd}
                            onChange={handleChange}
                            error={errors.taskDateEnd}
                        />
                    </div>

                    <IconButton 
                        variant="primary" 
                        size="md" 
                        type="submit">

                        Asignar
                    </IconButton>
                </form>
                {/* Columna derecha */}
                <div className="flex flex-col gap-3">

                    {/* Div general que contiene el título y el espacio de las tareas */}
                    <div>

                        {/* Título con línea degradada */}
                        <div className="flex flex-col items-center max-w-max mx-auto mb-1">
                            <h1 className="text-gradient-title text-h3 pb-0.5">Gestión de tareas</h1>
                            <div className="h-0.5 bg-gradiant-title-line w-full"></div>
                        </div>

                        {/* Espacio para las tarjetas de tareas */}
                        <div>

                            {/* Aquí se mapearían las tareas asignadas al usuario */}
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
