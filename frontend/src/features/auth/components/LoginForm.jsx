import { Input, Button, IconButton  } from "@/shared"
import React, {useState} from "react";
import { loginShema } from "../schemas/loginSchema";
import  logoSigi  from "@/assets/images/LOGO-SIGI.png";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import { Alert } from "@/shared";

export default function LoginForm() {
    const navigate = useNavigate();
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

    const handleSubmit = async (e) => {

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
        try {
            Alert.loading("Iniciando sesión", "Estamos validando su solicitud..."); //alerta de espera
            const data = await login(result.data);
            Alert.close(); //aleta se cierra
            Alert.success("Inicio de sesión exitoso");
            //console.log("LOGIN RESPONSE:", data);
            sessionStorage.setItem("token", data.access); //clave adta. access es lo que devuelve el backend

            //despues de loguear a donde me lleva
            navigate("/dashboard");
        } catch (error) {
            Alert.close();
            Alert.error("Error al iniciar sesión", error.message)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center relative h-screen">
            {/* contenedor principal */}
            <div className="bg-background-login-coontainer border-2 border-border-login-container p-12 w-90 shadow-lg shadow-border-login-container rounded-2xl">
                {/* contenenedor del titulo y la linea */}
                <div className="flex flex-col place-self-center mb-6 max-w-max place-items-center gap-4">
                    <h1 className="text-h3 font-medium text-text-primary justify-center text-center">Sistema de Gestión de Inventario</h1>
                    <img src={logoSigi} alt="Logo del sistema" className="h-auto w-18 "/>
                    <h1 className="text-gradient-title justify-end text-h3 pb-0.5">
                        Inicio de sesión
                    </h1>
                </div>
                <form className="grid grid-cols-1 w-fit items-center justify-center gap-10 " onSubmit={handleSubmit} noValidate>
                    {/* noValidate es para quitar las validaciones automaticas de html del navegador */}
                    {/* Inputs */}
                    <div className="grid grid-cols-1 w-62 gap-3 my-0 mx-auto">
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

                    <div className="flex flex-col items-center gap-3">
                        <IconButton
                            variant="primary"
                            size="md"
                            type="submit"
                        >
                            Iniciar sesión
                        </IconButton>
                        <Link to={"restore"} className="h-12">
                            <span className="text-small font-label">¿Olvidó su contraseña?</span>
                        </Link>
                    </div> 
            </form>
            </div>

        </div>
    )
};