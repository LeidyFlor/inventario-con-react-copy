import { Input, Button, IconButton, Select } from "@/shared"
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
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit mt-10">

                {/* contenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5">
                        Regresar material devolutivo/consumo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>


                    {/* Columna izquierda*/}
                {/* Layout de dos columnas */}
                <form className="flex gap-10 mx-2" onSubmit={handleSubmit} noValidate>

                    <div className="flex flex-col-2 gap-11">
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
                        <div className="flex flex-col gap-20">
                            <div>
                                <div className="flex gap-2 mb-1 justify-center">
                                <h2 className="font-bold text-body">ID péstamo:</h2>
                                <h2 className="text-body">AAB000000014</h2>
                                {/* Línea verde con width al 200% para que se extienda más allá del título y quede más estético */}

                                </div>
                            
                            <div className="h-0.5 bg-border-line-subtitle w-full"></div>
                            </div>
                            <Input
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
