import { Input, Button, IconButton, Select, Textarea } from "@/shared"
import React, { useState } from "react";
import { loanSchema } from "../schemas/loanSchema";

export default function ReturnLoan() {
    const [formData, setFormData] = useState({
        loanUserRequesterNote: "",

    });
    const [errors, setErrors] = useState({});
    // useState que me trae el arreglo mediante el get en servicios

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
        <div className="flex flex-col place-items-center justify-items-center relative">

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl">

                {/* contenedor del titulo y la linea */}
                <div className="grid md:grid-cols-2 grid-cols-1  mb-6 max-w-max gap-10 mb:gap-20 place-items-center">
                    <h1 className="text-gradient-title text-h3 pb-0.5 ">
                        Regresar material devolutivo/consumo
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                    </h1>
                    <div>
                        <div className="flex gap-2 mb-1 justify-center">
                            <h2 className="font-bold text-body">ID péstamo:</h2>
                            <h2 className="text-body">AAB000000014</h2>

                        </div>

                        <div className="h-0.5 bg-border-line-subtitle w-full"></div>
                    </div>
                </div>



                {/* Layout de dos columnas */}
                <form className="flex flex-row mx-2 w-max" onSubmit={handleSubmit} noValidate>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        {/* Selección de materiales */}
                        <div className="flex flex-col gap-4 place-items-center justify-center">
                            <h2 className="font-bold text-body">Selecciona los materiales a devolver</h2>
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

                        {/* Columna derecha */}
                        <div className="flex flex-col gap-10">
                            
                            <Textarea
                                label="Observación"
                                placeholder="Observación"
                                name="loanUserRequesterNote"
                                value={formData.loanUserRequesterNote}
                                onChange={handleChange}
                            />
                            {/* Botón crear */}
                            <div className="flex justify-end">
                                <IconButton
                                    variant="primary"
                                    size="md"
                                    type="submit"
                                >
                                    Aceptar
                                </IconButton>
                            </div>
                        </div>

                    </div>
                </form>
              
            </div>
        </div>
    );
}
