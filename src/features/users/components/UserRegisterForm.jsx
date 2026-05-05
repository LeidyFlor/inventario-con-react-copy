import { Input, Button, IconButton, Select } from "@/shared"
import React, {useState, useEffect} from "react";
import { getDocumentTypes, getUserTypes } from "@/features/users/services/selectService";
import { userShema } from "../schemas/userShema.js";

export default function UserRegisterForm() {
    const [formData, setFormData] = useState({
        userDocument: "",
        userName: "",
        userEmail: "",
        userEmail2: "",
        userAddres:"",
        userTel: "",
        userTel2: "",
        userPassword: "",
        userType: "",
        userDocumentType: "",
        userEmailConfir: "",
        userDateEnd: "",
        userDateStart: "",
    });
    const [errors, setErrors] = useState({});
    // useState que me trae el arreglo mediante el get en servicios
    const [documentTypes, setDocumentTypes] = useState([]);
    const [userTypes, setUserTypes] = useState([]);

    useEffect(() => {
        getDocumentTypes().then(setDocumentTypes);
        getUserTypes().then(setUserTypes);
    },[]); //los [] es para que al menos se ejecute una vez, no tiene dependencia
    
    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor cuando uno sale del campo

    // ==================================================
    //              Handle Genérico
    // ==================================================
    /*
        Función que se ejecuta cada vez que cambia el valor de un input del formulario, para que haga el re-render
    */
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
        const result = userShema.safeParse(formData);

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
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit mt-10">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5">
                        Registro de usuario
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="grid grid-cols-1 w-fit items-center justify-center gap-10 " onSubmit={handleSubmit} noValidate>
                    {/* noValidate es para quitar las validaciones automaticas de html del navegador */}
                    {/* Inputs */}
                    <div className="lg:grid lg:grid-cols-3 md:grid md:grid-cols-2 gap-4 my-0 mx-auto grid grid-cols-1">
                        <Select
                            label="Tipo de documento"
                            name="userDocumentType"
                            options={documentTypes}
                            value={formData.userDocumentType}
                            onChange={handleChange}
                            error={errors.userDocumentType}
                        />
                        <Input
                            placeholder="Numero de documento"
                            name= "userDocument"
                            label="Numero de documento"
                            value={formData.userDocument}
                            onChange={handleChange}
                            error={errors.userDocument}
                        />
                        <Select
                            label="Tipo de usuario"
                            name="userType"
                            options={userTypes}
                            value={formData.userType}
                            onChange={handleChange}
                            error={errors.userType}
                        />
                        <Input
                            placeholder="Ingrese su nombre completo"
                            name="userName"
                            label="Nombre completo"
                            value={formData.userName}
                            onChange={handleChange}
                            error={errors.userName}
                        />
                        <Input
                            placeholder="Dirección"
                            name="userAddres"
                            label="Dirección"
                            value={formData.userAddres}
                            onChange={handleChange}
                            error={errors.userAddres}
                        />
                        <Input
                            placeholder="Número telefónico"
                            type="tel"
                            name="userTel"
                            label="Número telefónico"
                            value={formData.userTel}
                            onChange={handleChange}
                            error={errors.userTel}
                        />
                        <Input
                            placeholder="Número telefónico 2"
                            type="tel"
                            name="userTel2"
                            label="Número telefónico 2"
                            value={formData.userTel2}
                            onChange={handleChange}
                            error={errors.userTel2}
                        />
                        <Input
                            placeholder="Correo electrónico"
                            type="email"
                            name="userEmail"
                            label="Correo electrónico"
                            value={formData.userEmail}
                            onChange={handleChange}
                            error={errors.userEmail}
                        />
                        <Input
                            placeholder="Confirmar correo electrónico"
                            type="email"
                            name="userEmailConfir"
                            label="Confirmar correo electrónico"
                            value={formData.userEmailConfir}   
                            onChange={handleChange}            
                            error={errors.userEmailConfir} 
                        />
                        <Input
                            placeholder="Correo institucional"
                            type="email"
                            name="userEmail2"
                            label="Correo institucional"
                            value={formData.userEmail2}
                            onChange={handleChange}
                            error={errors.userEmail2}
                        />
                        <Input
                            placeholder="Ingrese su contraseña"
                            type="password"
                            name="userPassword"
                            label="Contraseña"
                            value={formData.userPassword}
                            onChange={handleChange}
                            error={errors.userPassword}
                        />
                        <div className="flex gap-1.5">
                            {/* Fecha inicio usuario */}
                            <Input
                                type="date"
                                name="userDateStart"
                                label="Fecha inicio"
                                value={formData.userDateStart}
                                onChange={handleChange}
                                error={errors.userDateStart}
                            />
                            {/* Fecha fin usuario */}
                            <Input
                                type="date"
                                name="userDateEnd"
                                label="Fecha fin"
                                value={formData.userDateEnd}
                                onChange={handleChange}
                                error={errors.userDateEnd}
                            />
                        </div>

                        {/* Acciones */}
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                size="sm"
                            >
                                Nuevo grupo
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                size="sm"
                            >
                                Agregar telefono
                            </Button>

                        </div>

                        <div className="flex flex-col items-end justify-end gap-4">
                            <Button
                                variant="primary"
                                size="sm"
                            >
                                Agregar correo
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                            >
                                Agregar tarea
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-end justify-end">
                        <IconButton
                            variant="primary"
                            size="md"
                            type="submit"
                        >
                            Crear
                        </IconButton>
                    </div> 
            </form>
            </div>

        </div>
    )
};