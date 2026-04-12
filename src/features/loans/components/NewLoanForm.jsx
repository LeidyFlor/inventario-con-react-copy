import { Input, Button, IconButton, Select } from "@/shared"
import React, { useState, useEffect } from "react";
import { getUserName, getLoanTypes } from "@/features/loans/services/selectService.js";

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
    // useState que me trae el arreglo mediante el get en servicios
    const [userName, setUserName] = useState([]);
    const [loanTypes, setLoanTypes] = useState([]);

    useEffect(() => {
        getUserName().then(setUserName);
        getLoanTypes().then(setLoanTypes);
    },[]); //los [] es para que al menos se ejecute una vez, no tiene dependencia

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
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                {/* Layout de dos columnas */}
                <div className="grid grid-cols-2 gap-10">

                    {/* Columna izquierda*/}
                    {/* border-r -> línea vertical del centro que divide las columnas*/}
                    <div className="flex flex-col justify-evenly  border-r-2  pr-4">          
                        {/* Selección de materiales */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold">1. Selecciona los materiales</h2>
                            <div className="flex gap-3 justify-center">
                                <Button 
                                    variant="primary" 
                                    size="md"
                                >   Devolutivo
                                </Button>
                                <Button 
                                    variant="primary" 
                                    size="md"
                                > 
                                    Consumible
                                </Button>
                            </div>
                        </div>

                        {/* Selección usuario solicitante */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold">2. Selecciona usuario solicitante</h2>
                            <Select
                                name="userType"
                                options={userName}
                            />
                        </div>

                        {/* usuario prestador*/}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold">3. Usuario prestador</h2>
                            <div className="flex items-center gap-3">
                                <div className="">
                                    <Input
                                        placeholder="Nombre del prestador"
                                        name="usuarioPrestador"
                                        onBlur={handleBlur}
                                    />
                                </div>
                                {/* boton pra confirmar identidad*/}
                                <Button variant="outline" size="sm">
                                    Confirmar identidad
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Columna ingresar datos*/}
                    <div className="flex flex-col gap-6">
                        <h2 className="font-bold">4. Ingresar los siguientes datos:</h2>

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
                            <Select
                                label="Tipo de préstamo"
                                name="loanType"
                                options={loanTypes}
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
