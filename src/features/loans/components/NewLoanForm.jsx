import { Input, Button, IconButton, Select } from "@/shared"
import React, { useState, useEffect } from "react";
import { getUserName, getLoanTypes } from "@/features/loans/services/selectService.js";
import { loanSchema } from "../schemas/loanSchema";

export default function NewLoanForm() {
    const [formData, setFormData] = useState({
        loanUserRequester: "",
        loanUserLender: "",
        loanStudentsGroup: "",
        loanDateOut: "",
        loanJustification: "",
        loanDateIn: "",
        loanType: "",
    });
    const [errors, setErrors] = useState({});
    // useState que me trae el arreglo mediante el get en servicios
    const [userName, setUserName] = useState([]);
    const [loanTypes, setLoanTypes] = useState([]);

    useEffect(() => {
        getUserName().then(setUserName);
        getLoanTypes().then(setLoanTypes);
    },[]); //los [] es para que al menos se ejecute una vez, no tiene dependencia

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
        const result = loanSchema.safeParse(formData);

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
            <div className="mb-10">
                <Button variant="secondary" size="sm">
                    Atrás
                </Button>
            </div>

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-10 rounded-4xl">

                {/* contenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5">
                        Nuevo préstamo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                {/* Layout de dos columnas */}
                <form className="grid grid-cols-2 gap-10" onSubmit={handleSubmit} noValidate>

                    {/* Columna izquierda*/}
                    {/* border-r -> línea vertical del centro que divide las columnas*/}
                    <div className="flex flex-col justify-evenly  border-r-2  pr-4">          
                        {/* Selección de materiales */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold text-body">1. Selecciona los materiales</h2>
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
                            <h2 className="font-bold text-body">2. Selecciona usuario solicitante</h2>
                            <Select
                                name="loanUserRequester"
                                options={userName}
                                value={formData.loanUserRequester}
                                onChange={handleChange}
                                error={errors.loanUserRequester}
                            />
                        </div>

                        {/* usuario prestador*/}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold text-body">3. Usuario prestador</h2>
                            <div className="flex items-center gap-3">
                                <div className="">
                                    <Input
                                        placeholder="Nombre del prestador"
                                        name="loanUserLender"
                                        value={formData.loanUserLender}
                                        onChange={handleChange}
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
                        <h2 className="font-bold text-body">4. Ingresar los siguientes datos:</h2>

                        <div className="flex flex-col gap-4">
                            <Input 
                                placeholder="Grupo aprendices"
                                name="loanStudentsGroup"
                                label="Grupo aprendices"
                                value={formData.loanStudentsGroup}
                                onChange={handleChange}
                                error={errors.loanStudentsGroup}
                            />
                            <Input 
                                placeholder="Justificación de uso" 
                                name="loanJustification" 
                                label="Justificacion de uso"
                                value={formData.loanJustification}
                                onChange={handleChange}
                                error={errors.loanJustification}
                            />
                            <Select
                                label="Tipo de préstamo"
                                name="loanType"
                                options={loanTypes}
                                value={formData.loanType}
                                onChange={handleChange}
                                error={errors.loanType}
                            />
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    name="loanDateOut"
                                    label="Fecha salida"
                                    value={formData.loanDateOut}
                                    onChange={handleChange}
                                    error={errors.loanDateOut}
                                />
                                <Input
                                    label="Fecha de entrega"
                                    type="date"
                                    name="loanDateIn"
                                    value={formData.loanDateIn}
                                    onChange={handleChange}
                                    error={errors.loanDateIn}
                                />

                            </div>
                            
                        </div>

                        {/* Botón crear */}
                        <div className="flex justify-end">
                            <IconButton 
                                variant="primary" 
                                size="md"
                                type="submit"
                            >
                                Crear
                            </IconButton>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
