import { Input, Button, IconButton, Select, Checkbox } from "@/shared"
import React, {useState} from "react";
import { loginShema } from "../schemas/loginSchema";

export default function UserRegisterForm() {
    const [formData, setFormData] = useState({
        userEmail: "",
        userPassword: "",
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
        const result = loginShema.safeParse(formData);

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
            {/* contenedor verde */}
            <div className="bg-background-login-coontainer border-2 border-border-login-container p-13 w-fit mt-10 shadow-lg shadow-border-login-container rounded-2xl">
                {/* contenenedor del titulo y la linea */}
                <div className="flex flex-col place-self-center mb-6 max-w-max">
                    <h1 className="text-gradient-title justify-end text-h3 pb-0.5">
                        Inicio de sesión
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="grid grid-cols-1 w-fit items-center justify-center gap-10 " onSubmit={handleSubmit} noValidate>
                    {/* noValidate es para quitar las validaciones automaticas de html del navegador */}
                    {/* Inputs */}
                    <div className="grid grid-cols-1 gap-3 my-0 mx-auto">
                        <Input
                            placeholder="Usuario"
                            type="email"
                            name="userEmail"
                            label="Usuario"
                            value={formData.userEmail}
                            onChange={handleChange}
                            error={errors.userEmail}
                        />
                        <Input
                            placeholder="Contraseña"
                            type="password"
                            name="userPassword"
                            label="Contraseña"
                            value={formData.userPassword}
                            onChange={handleChange}
                            error={errors.userPassword}
                        />

                        {/* Acciones */}

                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <IconButton
                            variant="primary"
                            size="md"
                            type="submit"
                        >
                            Iniciar sesión
                        </IconButton>
                        <span className="text-caption">¿Olvidó su contraseña?</span>
                    </div> 
            </form>
            </div>

        </div>
    )
};