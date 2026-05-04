import { Input, Button, IconButton, Select } from "@/shared"
import React, {useState, useEffect} from "react";
import { getDocumentTypes, getUserTypes } from "@/features/users/services/selectService";
import { userShema } from "../schemas/userShema.js";

export default function UserEditForm() {
    const [formData, setFormData] = useState({
        userDocument: "",
        userName: "",
        userEmail: "",
        userEmail2: "",
        userAddres:"",
        userTel: "",
        userTel2: "",
        userType: "",
        userDocumentType: "",
        userEmailConfir: "",
        userDateStart: "",
        userDateEnd: "",
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
    return(
        <div className="flex flex-col place-items-center justify-items-center relative">

            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit mt-2">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 sm:pb-0.5">
                        Editar perfil del usuario
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="lg:flex lg:flex-row flex-col items-center justify-between lg:gap-10" onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col gap-2 place-items-center">
                        <Input
                            placeholder="subir imagen"
                            type="image"
                            name="userPhoto"
                        />
                        <Input
                            placeholder="Pepito Perez"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            error={errors.userName}
                            variant="nameEdit"
                        />
                        <div className="flex gap-10 place-items-center justify-center">
                            <h3 className="font-semibold text-medium">Estado</h3>
                            <Button 
                                variant="warning"
                                size="sm"
                            >
                                Editar
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-dense  items-center gap-10 bg-background border-2 border-border-edit-informaion p-8 rounded-xl sm:mt-4">
                        <div className="md:grid md:grid-cols-2 grid grid-cols-1 auto-cols-[150px] items-center gap-3">
                            <p className="parrafo-edit-style ">Tipo de documento:</p>
                            <Select
                                name="userDocumentType"
                                options={documentTypes}
                                value={formData.userDocumentType}
                                onChange={handleChange}
                                error={errors.userDocumentType}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Número de documento:</p>
                            <Input
                                placeholder="10000001"
                                name="userDocument"
                                value={formData.userDocument}
                                onChange={handleChange}
                                error={errors.userDocument}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Tipo de usuario:</p>
                            <Select
                                name="userType"
                                options={userTypes}
                                value={formData.userType}
                                onChange={handleChange}
                                error={errors.userType}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Fecha inicio:</p>
                            <Input
                                type="date"
                                name="userDateStart"
                                value={formData.userDateStart}
                                onChange={handleChange}
                                variant="isEdit"
                                error={errors.userDateStart}
                            />
                            <p className="parrafo-edit-style">Fecha fin:</p>
                            <Input
                                type="date"
                                name="userDateEnd"
                                value={formData.userDateEnd}
                                onChange={handleChange}
                                variant="isEdit"
                                error={errors.userDateEnd}
                            />
                            <p className="parrafo-edit-style">Correo electrónico:</p>
                            <Input
                                placeholder="pepito33@gmail.com"
                                type="email"
                                name="userEmail"
                                value={formData.userEmail}
                                onChange={handleChange}
                                error={errors.userEmail}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Número telefónico:</p>
                            <Input
                                placeholder="32000000"
                                type="tel"
                                name="userTel"
                                value={formData.userTel}
                                onChange={handleChange}
                                error={errors.userTel}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Dirección:</p>
                            <Input
                                placeholder="Dg. 27a #4-2 a 4-114, Dosquebradas"
                                name="userAddres"
                                value={formData.userAddres}
                                onChange={handleChange}
                                error={errors.userAddres}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Segundo número telefónico:</p>
                            <Input
                                placeholder="32000000"
                                type="tel"
                                name="userTel2"
                                value={formData.userTel2}
                                onChange={handleChange}
                                error={errors.userTel2}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Correo institucional:</p>
                            <Input
                                placeholder="pepito33@sena.edu.co"
                                type="email"
                                name="userEmail"
                                value={formData.userEmail}
                                onChange={handleChange}
                                error={errors.userEmail}
                                variant="isEdit"
                            />
                            {/* botones de accion */}
                                <div className="place-items-start">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                                <div className="mt-1 flex items-end justify-end">
                                    <IconButton
                                        variant="primary"
                                        size="md"
                                        type="submit"
                                    >
                                        Guardar
                                    </IconButton>
                                </div>
                            
                        </div>

                    </div>
                    <div>

                    </div>
                </form>

            </div>
        </div>
    )
}