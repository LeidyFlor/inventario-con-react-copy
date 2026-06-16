import { Input, Button, IconButton, Select } from "@/shared"
import React, { useState, useEffect } from "react";
import { getUserName, getLoanTypes } from "@/features/loans/services/selectService.js";
import { loanSchema } from "../schemas/loanSchema";
import { FilePlus2 } from "lucide-react"

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
       <div className="flex flex-col place-items-center justify-items-center relative px-4">

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-4 md:p-6 rounded-4xl w-full max-w-4xl overflow-hidden">

                {/* Título */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5 flex items-center gap-3">
                        <FilePlus2 className="text-brand"/>
                        Nuevo préstamo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form
                    className="flex flex-col md:flex-row gap-6 md:gap-10"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {/* Columna IZQUIERDA */}
                    <div className="flex flex-col gap-6 md:gap-0 md:justify-evenly border-b-2 md:border-b-0 md:border-r-2 pb-6 md:pb-0 md:pr-4 bg-gradiant-cian-purple-line w-full md:w-1/2 min-w-0">

                        {/* 1. Materiales */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold text-body">1. Selecciona los materiales</h2>
                            <div className="flex gap-3 justify-center">
                                <Button variant="primary" size="md">Devolutivo</Button>
                                <Button variant="primary" size="md">Consumible</Button>
                            </div>
                        </div>

                        {/* 2. Usuario solicitante */}
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

                        {/* 3. Usuario prestador */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold text-body">3. Usuario prestador</h2>
                            <div className="flex flex-row items-center w-full gap-3">
                                <Input
                                    placeholder="Nombre del prestador"
                                    name="loanUserLender"
                                    value={formData.loanUserLender}
                                    onChange={handleChange}
                                />
                                <div className="whitespace-nowrap">
                                    <Button variant="outline" size="sm">
                                        Confirmar identidad
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna DERECHA */}
                    <div className="flex flex-col gap-6 w-full md:w-1/2 min-w-0">
                        <h2 className="font-bold text-body">4. Ingresar los siguientes datos:</h2>

                        <div className="flex flex-col gap-4 w-full">
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

                            <div className="flex flex-row gap-2 overflow-hidden">
                                <div className="flex-1 min-w-0 w-0">
                                    <Input
                                        type="date"
                                        name="loanDateOut"
                                        label="Fecha salida"
                                        value={formData.loanDateOut}
                                        onChange={handleChange}
                                        error={errors.loanDateOut}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 w-0">
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
                        </div>

                        <div className="flex justify-end">
                            <IconButton variant="primary" size="md" type="submit">
                                Crear
                            </IconButton>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
