import { Input, Button, IconButton  } from "@/shared"
import React, {useState} from "react";
// Sin validación Zod en el login: no queremos revelar al usuario
// si el formato del usuario es un correo ni el largo mínimo de la contraseña.
import  logoSigi  from "@/assets/images/LOGO-SIGI.png";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import { setMustChangePassword } from "../services/passwordFlag";
import { Alert } from "@/shared";

export default function LoginForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userEmail: "",
        userPassword: "",
    });
    // No se usan errores por campo — todo error se muestra como credenciales inválidas


    
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

        // Validación mínima: solo verificar que los campos no estén vacíos.
        // No se dan pistas sobre formato (correo, largo de contraseña, etc.)
        if (!formData.userEmail.trim() || !formData.userPassword.trim()) {
            Alert.error("Credenciales inválidas", "Verifica tus datos e intenta de nuevo.")
            return
        }

        try {
            Alert.loading("Iniciando sesión", "Estamos validando su solicitud...")
            const data = await login(formData)
            Alert.close()
            Alert.success("Inicio de sesión exitoso")
            sessionStorage.setItem("token", data.access)
            // Si el usuario todavía tiene la contraseña temporal, el backend
            // manda must_change_password en true. Se guarda la marca y se
            // entra directo a la pantalla de cambio obligatorio, de la que no
            // se puede salir hasta cambiarla.
            setMustChangePassword(data.must_change_password)
            navigate(data.must_change_password ? "/dashboard/change-password" : "/dashboard")
        } catch (err) {
            Alert.close()

            // 409 = el usuario ya tiene una sesión activa (otro dispositivo/pestaña,
            // o cerró abruptamente y aún no pasó el periodo de gracia del heartbeat).
            // Este caso sí se distingue porque no revela nada sobre la contraseña,
            // solo informa un estado legítimo para que la persona entienda qué pasa.
            // Cualquier otro error (401, red, etc.) se muestra genérico a propósito,
            // para no revelar si el usuario existe o si la contraseña es incorrecta.
            //
            // 403 = la cuenta está desactivada. Pasa cuando el usuario nunca
            // cambió su contraseña temporal dentro del plazo de 2 horas, o
            // cuando un administrador lo desactivó. El backend solo devuelve
            // este estado si la contraseña era correcta, así que mostrarlo no
            // revela nada de más. Se usa el mensaje que manda el backend para
            // no repetir el texto en dos lugares.
            if (err.status === 409) {
                Alert.error(
                    "Sesión ya activa",
                    "Este usuario ya tiene una sesión abierta en otro dispositivo o pestaña. Ciérrala, o espera unos minutos si se cerró abruptamente."
                )
            } else if (err.status === 403) {
                Alert.error("Cuenta desactivada", err.message)
            } else {
                Alert.error("Credenciales inválidas", "Verifica tus datos e intenta de nuevo.")
            }
        }
    }

    return (
        <div className="flex flex-col items-center justify-center relative h-screen">
            {/* contenedor principal */}
            <div className="bg-background-login-coontainer border-2 border-border-login-container p-10 w-90 shadow-lg shadow-border-login-container rounded-2xl">
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
                        />
                        <Input
                            placeholder="Contraseña"
                            type="password"
                            name="userPassword"
                            label="Contraseña"
                            value={formData.userPassword}
                            onChange={handleChange}
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
            <p className="mt-4 text-small text-text-muted bg-background ">
                Para registrarse comunícarse al correo yleon@sena.edu.co.
            </p>
        </div>
    )
};