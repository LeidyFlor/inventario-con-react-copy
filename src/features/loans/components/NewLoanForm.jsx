import { Input, Button, IconButton } from "@/shared"
import React, { useState } from "react";

export default function NewLoanForm() {
    const [formData, setFormData] = useState({
        usuarioSolicitante: "",
        usuarioPrestador: "",
        grupoAprendices: "",
        fechaSalida: "",
        justificacion: "",
        fechaEntrega: "",
        tipoPrestamo: "",
    });

    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor al salir del campo
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value, //con name React sabe que campo actualizar
        })
        console.log("Input ", e.target.value); 
    }

    return (
        <div>
            <div className="mb-10">
                <Button variant="secondary" size="sm">
                    Atrás
                </Button>
            </div>

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-10 rounded-4xl">

                {/* contenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-2xl pb-0.5">
                        Nuevo préstamo
                    </h1>
                </div>

                {/* Layout de dos columnas */}
                <div className="grid grid-cols-2 gap-10">

                    {/* Columna izquierda*/}
                    <div className="flex flex-col gap-8 pr-10 border-r border-border-green-container">

                        {/* Selección de materiales */}
                        <div className="flex flex-col gap-4">
                            <span className="font-bold">1. Selecciona los materiales</span>
                            <div className="flex gap-3">
                                <Button 
                                    variant="primary" 
                                    size="sm"
                                >   Devolutivo
                                </Button>
                                <Button 
                                    variant="primary" 
                                    size="sm"
                                > 
                                    Consumible
                                </Button>
                            </div>
                        </div>

                        {/* Selección usuario solicitante */}
                        <div className="flex flex-col gap-4">
                            <span className="font-bold">2. Selecciona usuario solicitante</span>
                            <Input
                                placeholder="Seleccione usuario"
                                name="usuarioSolicitante"
                                onBlur={handleBlur}
                            />
                        </div>

                        {/* usuario prestador*/}
                        <div className="flex flex-col gap-4">
                            <span className="font-bold">3. Usuario prestador</span>
                            <div className="flex items-center gap-3">
                                <Input
                                    placeholder="Nombre del prestador"
                                    name="usuarioPrestador"
                                    onBlur={handleBlur}
                                />
                                {/* variant="outline" significa que el botón tendrá un estilo de "contorno". Esto crea botones con fondo transparente y un borde coloreado */}
                                <Button variant="outline" size="sm">
                                    Confirmar identidad
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Columna ingresar datos*/}
                    <div className="flex flex-col gap-6">
                        <span className="font-bold">4. Ingresar los siguientes datos:</span>

                        <div className="flex flex-col gap-4">
                            <Input 
                                placeholder="Grupo aprendices"
                                name="grupoAprendices"
                                onBlur={handleBlur} 
                            />
                            <Input
                                placeholder="Fecha salida" 
                                name="fechaSalida" 
                                onBlur={handleBlur} 
                            />
                            <Input 
                                placeholder="Justificación de uso" 
                                name="justificacion" 
                                onBlur={handleBlur} 
                            />
                            <Input 
                                placeholder="Fecha de entrega" 
                                name="fechaEntrega" 
                                onBlur={handleBlur} 
                            />
                            <Input 
                                placeholder="Tipo de préstamo" 
                                name="tipoPrestamo" 
                                onBlur={handleBlur} 
                            />
                        </div>

                        {/* Botón crear */}
                        <div className="flex justify-end">
                            <IconButton 
                                variant="primary" 
                                size="md"
                            >
                                Crear
                            </IconButton>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
