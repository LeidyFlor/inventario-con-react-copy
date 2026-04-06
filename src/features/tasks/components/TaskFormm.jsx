import { Input, Button, IconButton, DateInput } from "@/shared"
import React, { useState } from "react";

{/* Se creó una función Card para no repetir el mismo bloque de tarjeta 4 veces. 
    Como las funciones JS, definimos una vez y la usamos las veces necesarias.
    Pasamos los datos de cada tarea y ella se encarga de mostrarlos. */}
function Card({ nombre, estado, colorEstado, fechaInicio, fechaFin, descripcion }) {
    return (
        <div className="grid grid-cols-3 rounded-2xl">
            <div className="flex flex-col gap-1 p-3 col-span-1">
                <p className="font-bold text-sm" style={{ color: "var(--secundary-950)" }}>Tarea: {nombre}</p>
                <p className="text-sm" style={{ color: colorEstado }}>Estado: {estado}</p>
                <p className="text-sm" style={{ color: "var(--quaternary-950)" }}>Fecha inicio: {fechaInicio}</p>
                <p className="text-sm" style={{ color: "var(--quaternary-950)" }}>Fecha Fin: {fechaFin}</p>
            </div>
            <div className="p-3 border-2 rounded-2xl col-span-2" style={{ borderColor: "var(--secundary-500)" }}>
                <p className="font-bold text-sm" style={{ color: "var(--quaternary-950)" }}>Descripción:</p>
                <p className="text-sm" style={{ color: "var(--quaternary-950)" }}>{descripcion}</p>
            </div>
        </div>
    );
}


export default function TaskForm() {
    const [formData, setFormData] = useState({
        tipoUsuario: "",
        nombreTarea: "",
        descripcionTarea: "",
        estadoTarea: "",
        fechaInicio: "",
        fechaFin: "",
    });

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        console.log("Input ", e.target.value);
    }

    return (
        <div>
            <div className="mb-4">
                <Button variant="secondary" size="sm">
                    Atrás
                </Button>
            </div>

            {/* Layout dos columnas: formulario y tarjetas */}
            <div className="grid grid-cols-2 gap-10">

                {/* Usuario y formulario de tarea */}
                <div className="flex flex-col items-center gap-4">

                    {/* Secciónusuario */}
                    <div className="max-w-max">
                        <span className="text-xl">Usuario: Pepito Perez</span>
                    </div>

                    <Input placeholder="Tipo de usuario" name="tipoUsuario" onBlur={handleBlur} />

                    {/* Sección agregar tarea*/}
                    <div className="max-w-max">
                        <span className="text-xl">Agregar tarea</span>
                    </div>

                    <Input placeholder="Nombre tarea" name="nombreTarea" onBlur={handleBlur} />

                    <Input placeholder="Descripción tarea" name="descripcionTarea" onBlur={handleBlur} />

                    <Input placeholder="Estado tarea" name="estadoTarea" onBlur={handleBlur} />

                    <div className="flex gap-3">

                        <DateInput 
                            label="Fecha inicio" 
                            name="fechaInicio" 
                            onBlur={handleBlur} 
                        />
                        <DateInput 
                            label="Fecha fin"    
                            name="fechaFin"    
                            onBlur={handleBlur} 
                        />
                    </div>

                    <IconButton 
                        variant="primary" 
                        size="md"
                    >
                        Asignar
                    </IconButton>
                </div>

               {/* Título y tarjetas de tareas */}
                <div className="flex flex-col gap-3 mr-10">

                    {/* Título con línea degradada */}
                    <div className="flex flex-col items-center max-w-max mx-auto mb-1">
                        <h1 className="text-gradient-title text-2xl pb-0.5">Gestión de tareas</h1>
                        <div className="h-0.5 bg-gradiant-title-line w-full"></div>
                    </div>

                    {/* Contenedor verde con todas las tarjetas adentro */}
                    <div className="border-4 p-4 rounded-4xl flex flex-col gap-3" style={{ background: "var(--secundary-100)", borderColor: "var(--secundary-200)" }}>

                        <Card
                            nombre="Registrar inventario" 
                            estado="Pendiente" 
                            colorEstado="var(--secundary-950)" 
                            fechaInicio="10/02/2025" 
                            fechaFin="10/02/2025" 
                            descripcion="Lorem ipsum dolor sit amet consectetur adipiscing elit quisque, vulputate viverra nostra per dapibus."
                        />
                        <Card 
                            nombre="Registrar inventario" 
                            estado="En progreso" 
                            colorEstado="var(--tertiary-950)"  
                            fechaInicio="10/02/2025" 
                            fechaFin="10/02/2025" 
                            descripcion="Lorem ipsum dolor sit amet consectetur adipiscing elit quisque, vulputate viverra nostra per dapibus." 
                        />
                        <Card 
                            nombre="Registrar inventario" 
                            estado="Pendiente"   
                            colorEstado="var(--secundary-950)" 
                            fechaInicio="10/02/2025" 
                            fechaFin="10/02/2025" 
                            descripcion="Lorem ipsum dolor sit amet consectetur adipiscing elit quisque, vulputate viverra nostra per dapibus." 
                        />
                        <Card 
                            nombre="Registrar inventario" 
                            estado="Pendiente"   
                            colorEstado="var(--secundary-950)" 
                            fechaInicio="10/02/2025" 
                            fechaFin="10/02/2025" 
                            descripcion="Lorem ipsum dolor sit amet consectetur adipiscing elit quisque, vulputate viverra nostra per dapibus." 
                        />

                    </div>

                </div>
            </div>
        </div>
    );
}