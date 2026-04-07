import { Input, Button, IconButton } from "@/shared"
import React, { useState } from "react";

export default function TaskForm() {
    const [formData, setFormData] = useState({
        tipoUsuario: "",
        nombreTarea: "",
        descripcionTarea: "",
        estadoTarea: "",
        fechaInicio: "",
        fechaFin: "",
    });

    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor cuando uno sale del campo
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value //con name react sabe que campo actualizar
        })
        console.log("Input ", e.target.value);
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
                <div className="flex flex-col items-center gap-4">

                    {/* Sección usuario */}
                    <div className="flex flex-col items-center w-fit">
                        <h2 className="font-bold text-xl">Usuario: Pepito Perez</h2>
                        {/* Línea verde con width al 200% para que se extienda más allá del título y quede más estético */}
                        <div className="h-0.5 bg-green-700 w-[200%]"></div>
                    </div>

                    <Input
                        placeholder="Tipo de usuario"
                        name="tipoUsuario"
                        onBlur={handleBlur}
                    />

                    {/* Sección agregar tarea */}
                    <div className="flex flex-col items-center w-fit">
                        <h2 className="font-bold text-xl">Agregar tarea</h2>
                        {/* Línea verde con width al 320% para que se extienda más allá del título y quede más estético */}
                        <div className="block h-0.5 bg-green-700 w-[320%]"></div>
                    </div>

                    <Input 
                        placeholder="Nombre tarea" 
                        name="nombreTarea" 
                        onBlur={handleBlur} 
                    />
                    <Input 
                        placeholder="Descripción tarea" 
                        name="descripcionTarea" 
                        onBlur={handleBlur} 
                    />
                    <Input 
                        placeholder="Estado tarea" 
                        name="estadoTarea" 
                        onBlur={handleBlur} 
                    />

                    {/* Fechas: se usa type="date" para que el navegador muestre el selector de fecha */}
                    <div className="flex gap-3">
                        <Input 
                            placeholder="DD/MM/AAAA" 
                            type="date" 
                            name="fechaInicio" 
                            onBlur={handleBlur}
                            label = "Fecha inicio"
                            className="w-[200px]"
                            labelInside  
                        />
                        <Input 
                            placeholder="DD/MM/AAA" 
                            type="date" 
                            name="fechaFin"    
                            onBlur={handleBlur} 
                            label="Fecha Fin"
                            className="w-[200px]"
                            labelInside  
                        />
                    </div>

                    <IconButton variant="primary" size="md">
                        Asignar
                    </IconButton>
                </div>

                {/* Columna derecha */}
                <div className="flex flex-col gap-3">

                    {/* Div general que contiene el título y el espacio de las tareas */}
                    <div>

                        {/* Título con línea degradada */}
                        <div className="flex flex-col items-center max-w-max mx-auto mb-1">
                            <h1 className="text-gradient-title text-2xl pb-0.5">Gestión de tareas</h1>
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
