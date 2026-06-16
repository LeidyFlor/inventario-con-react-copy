import { Input, Button, IconButton, Select, StatusSwitch, FileInput } from "@/shared"
import React, {useState, useEffect} from "react";
import { getDocumentTypes, getUserTypes } from "@/features/users/services/selectService";
import { userShema } from "../schemas/userShema.js";
import { useParams, useNavigate } from "react-router-dom";
import { users } from "../data/users";
import { fileSchema } from "@/shared";
import { FilePenLine } from "lucide-react";

export default function UserEditForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = users.find(u => u.id === Number(id));
    //Fromateo de fecha de Iso a AAAA-MM-DD
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0]; // "2026-01-01"
    };

    const [formData, setFormData] = useState({
        userDocument: user?.userDocument ?? "",
        userName: user?.userName ?? "",
        userEmail: user?.userEmail ?? "",
        userEmail2: user?.userEmail2 ?? "",
        userAddres: user?.userAddres ?? "",
        userTel: user?.userTel ?? "",
        userTel2: user?.userTel2 ?? "",
        userType: user?.userType ?? "",
        userDocumentType: user?.userDocumentType ?? "",
        userDateStart: formatDateForInput(user?.userDateStart ?? ""),
        userDateEnd: formatDateForInput(user?.userDateEnd ?? ""),
        is_active: user?.is_active ?? "",
        userImage: user?.userIamgen ?? [],
    });
    const [isActive, setIsActive] = useState(user?.is_active ?? true);
    const [errors, setErrors] = useState({});
    // useState que me trae el arreglo mediante el get en servicios
    const [documentTypes, setDocumentTypes] = useState([]);
    const [userTypes, setUserTypes] = useState([]);
    const [imagen, setImagen] = useState(user?.userImage ?? null);
    //Boton que para mostrar el FielInput
    const [showFileInput, setShowFileInput] = useState(false);

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
        //SE LLMA LA API PARA GUARDAR LOS RESULTADOS
    }
    if (!user) return <p>Usuario no encontrado</p>;
    return(
        <div className="flex flex-col place-items-center justify-items-center w-full">

            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full mt-2">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <FilePenLine className="text-brand" />
                        Editar usuario
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>
                {/* contenedor princiapl */}
                {/* CAMBIO GENERADO AQUÍ */}
                <form className="flex flex-col lg:grid lg:grid-cols-[420px_1fr] lg:items-center gap-8 w-full" onSubmit={handleSubmit} noValidate>
                    {/* Contenedor izquierdo */}
                    {/* CAMBIO GENERADO AQUÍ */}
                    <div className="w-full max-w-[320px] mx-auto flex flex-col items-center p-4 gap-4">
                        {/* Contenedor fileInput Imagen del archivo. tipo de arhcivo, cantidad y tamano */}
                        <div className="flex flex-col gap-4 place-items-center">
                            {/* Imagen actual o inicial con letra */}
                            {imagen ? (
                                <img
                                src={imagen}
                                alt={user.userName}
                                className="w-48 h-48 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                    <span className="text-2xl">{user.userName?.charAt(0).toUpperCase()}</span>
                                </div>
                            )}

                            <h2 className=" w-80">Puede subir 1 archivo, archivos permitidos: PDF, PNG, JPG. Máximo de 10MB</h2>
                            {/* Botón OR FileInput — nunca los dos a la vez */}
                            {!showFileInput ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    type="button"
                                    onClick={() => setShowFileInput(true)}
                                >
                                    Cambiar imagen
                                </Button>
                            ) : (
                                <FileInput
                                    value={formData.userImage ?? []}
                                    onChange={(files) => {
                                        setFormData(prev => ({ ...prev, userImage: files }));
                                        if (files.length > 0) {
                                            setImagen(URL.createObjectURL(files[0]));
                                            setShowFileInput(false); // 👈 oculta el FileInput al seleccionar
                                        }
                                    }}
                                    multiple={false}
                                />
                            )}

                            {errors.userImage && (
                                <span className="text-red-800 text-sm">{errors.userImage}</span>
                            )}

                        </div>
                        <Input
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            error={errors.userName}
                            variant="nameEdit"
                        />
                       
                        {/* Estado y Editar */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-medium">Estado</span>
                                <StatusSwitch
                                    checked={isActive}
                                    onChange={() => setIsActive(prev => !prev)}
                                    className={`inline-flex`}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Contenedor derecho */}
                    <div className="w-full flex flex-col gap-4 bg-background border-2 border-border-edit-informaion p-8 rounded-xl ">
                        {/* CAMBIO GENERADO AQUÍ */}
                        <div className="grid grid-cols-1 md:grid-cols-2  gap-x-6 gap-y-5 items-center gap-4"> 
                            <div>
                                <p className="parrafo-edit-style ">Tipo de documento:</p>
                                <Select
                                    name="userDocumentType"
                                    options={documentTypes}
                                    value={formData.userDocumentType}
                                    onChange={handleChange}
                                    error={errors.userDocumentType}
                                    variant="isEdit"
                                />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Número de documento:</p>
                                <Input
                                    name="userDocument"
                                    value={formData.userDocument}
                                    onChange={handleChange}
                                    error={errors.userDocument}
                                    variant="isEdit"
                                />
                            </div>
                            <div>
                            <p className="parrafo-edit-style">Tipo de usuario:</p>
                            <Select
                                name="userType"
                                options={userTypes}
                                value={formData.userType}
                                onChange={handleChange}
                                error={errors.userType}
                                variant="isEdit"
                            />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Fecha inicio:</p>
                                <Input
                                    type="date"
                                    name="userDateStart"
                                    value={formData.userDateStart}
                                    onChange={handleChange}
                                    variant="isEdit"
                                    error={errors.userDateStart}
                                />
                            </div>
                            <div>
                            <p className="parrafo-edit-style">Fecha fin:</p>
                            <Input
                                type="date"
                                name="userDateEnd"
                                value={formData.userDateEnd}
                                onChange={handleChange}
                                variant="isEdit"
                                error={errors.userDateEnd}
                            />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Correo electrónico:</p>
                                <Input
                                    type="email"
                                    name="userEmail"
                                    value={formData.userEmail}
                                    onChange={handleChange}
                                    error={errors.userEmail}
                                    variant="isEdit"
                                />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Número telefónico:</p>
                                <Input
                                    type="tel"
                                    name="userTel"
                                    value={formData.userTel}
                                    onChange={handleChange}
                                    error={errors.userTel}
                                    variant="isEdit"
                                />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Dirección:</p>
                                <Input
                                    name="userAddres"
                                    value={formData.userAddres}
                                    onChange={handleChange}
                                    error={errors.userAddres}
                                    variant="isEdit"
                                />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Segundo número telefónico:</p>
                                <Input
                                    type="tel"
                                    name="userTel2"
                                    value={formData.userTel2}
                                    onChange={handleChange}
                                    error={errors.userTel2}
                                    variant="isEdit"
                                />
                            </div>
                            <div>
                                <p className="parrafo-edit-style">Correo institucional:</p>
                                <Input
                                    type="email"
                                    name="userEmail2"
                                    value={formData.userEmail2}
                                    onChange={handleChange}
                                    error={errors.userEmail2}
                                    variant="isEdit"
                                />
                            </div>
                            {/* botones de accion */}
                            <div className="col-span-1 md:col-span-2 flex justify-between place-items-center gap-4 pt-4">
                                <div className="place-items-start">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={ () => navigate(-1)}
                                        type="button"
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

                    </div>
                </form>

            </div>
        </div>
    )
}