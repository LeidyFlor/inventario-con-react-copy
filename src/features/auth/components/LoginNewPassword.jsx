import { Input, Button, IconButton, Select, Checkbox } from "@/shared"
import React, { useState } from "react";
import { restorePasswordSchema } from "../schemas/restorePasswordSchema";
import logoSigi from "@/assets/images/LOGO-SIGI.png";
import { useNavigate } from "react-router-dom";

export default function LoginRestoreNewPassword() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userPassword: "",
        userPasswordConfir: "",
    });
    const [errors, setErrors] = useState({});


    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor cuando uno sale del campo

    // ==================================================
    //              Handle Genérico
    // ==================================================
    /*
        Función que se ejecuta cada vez que cambia el valor de un input del formulario, para que haga el re-render
    */
    const handleChange = (e) => {
        // Se obtiene el nombre del campo y su valor
        const { name, value, type, checked } = e.target; //target es lo que viene cuando se escribe

        setFormData((prev) => ({
            //Se copian todos los valores anteriores del estado
            ...prev,

            //Se actualiza unicamente lo que cambió
            [name]: type === "checkbox" ? checked : value,
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
        const result = restorePasswordSchema.safeParse(formData);

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
        navigate("/auth") //Despues de las validaciones se navega acá
    }

    return (
        <div className="flex flex-col items-center justify-center relative h-screen">
            {/* contenedor principal */}
            <div className="bg-background-login-coontainer border-2 border-border-login-container p-13 w-fit shadow-lg shadow-border-login-container rounded-2xl relative">
                <div className="top-4 left-2 absolute w-fit h-fit z-5">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(-1)}
                    >
                        Atrás
                    </Button>

                </div>

                {/* contenenedor del titulo*/}
                <div className="flex flex-col place-self-center mb-6 max-w-max place-items-center gap-4">
                    <h1 className="text-gradient-title justify-end text-h3 pb-0.5">
                        Nueva contraseña
                    </h1>
                    <img src={logoSigi} alt="Logo del sistema" className="h-auto w-18 " />
                    
                </div>
                <form className="grid grid-cols-1 w-fit items-center justify-center gap-10 " onSubmit={handleSubmit} noValidate>
                    {/* noValidate es para quitar las validaciones automaticas de html del navegador */}
                    {/* Inputs */}
                    <div className="grid grid-cols-1 gap-3 my-0 mx-auto">
                        <Input
                            placeholder="Contraseña"
                            type="password"
                            name="userPassword"
                            label="Contraseña"
                            value={formData.userPassword}
                            onChange={handleChange}
                            error={errors.userPassword}
                        />
                        <Input
                            placeholder="Confirmación de contraseña"
                            type="password"
                            name="userPasswordConfir"
                            label="Confirmación de contraseña"
                            value={formData.userPasswordConfir}
                            onChange={handleChange}
                            error={errors.userPasswordConfir}
                        />

                        {/* Acciones */}

                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <IconButton
                            variant="primary"
                            size="md"
                            type="submit"
                        >
                            Aceptar
                        </IconButton>

                    </div>
                </form>
                <div className="flex gap-1 mt-3 justify-center">
                    <span className="text-small text-text-muted w-80">
                        La contraseña debe ser de 7-8 caracteres. Incluyendo: 1 Mayúscula, 1 Mínuscula, 1 Número, 1 carácter especial (!,$%+-*)
                    </span>
                </div>

            </div>
        </div>
    )
};