import { Input, Button, IconButton, Select, StatusSwitch, FileInput, MultiSelect } from "@/shared"
import React, {useState, useEffect} from "react";
import { getDocumentTypes, getUserTypes } from "@/features/users/services/selectService";
import { userShema } from "../schemas/userShema.js";
import { UserRoundPlus } from "lucide-react";
import { Alert } from "@/shared";
import { createUser } from "../services/userService.js";
import { useNavigate } from "react-router-dom";
import { GroupCreateModalPage } from "@/features/groups";
import { TaskCreateModal } from "@/features/tasks";
import { createTaskForUser } from "@/features/tasks/services/taskService";

export default function UserRegisterForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({  
        userDocument: "",
        First_name: "",
        Last_name: "",
        userEmail: "",
        userEmail2: "",
        userAddres:"",
        userTel: "",
        userTel2: "",
        userPassword: "",
        userType: "",
        userDocumentType: "",
        userDateEnd: "",
        userDateStart: "",
        is_accountant: false,
        userImage: []
    });
    const [errors, setErrors] = useState({});
    // useState que me trae el arreglo mediante el get en servicios
    const [documentTypes, setDocumentTypes] = useState([]);
    const [userTypes, setUserTypes] = useState([]);
    // Modal para crear grupo al vuelo
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    // Modal para agregar tarea al vuelo
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    // Tarea pendiente: se guarda en estado hasta que el usuario sea creado
    const [pendingTask, setPendingTask] = useState(null);

    useEffect(() => {
        getDocumentTypes().then(setDocumentTypes);
        getUserTypes().then(setUserTypes);
    },[]); //los [] es para que al menos se ejecute una vez, no tiene dependencia
    //Estado que controla el Switch
    const [isActive, setIsActive] = useState(true);

    //Manejadro del estado del switch 😂
    const handleStatusChange = (value) => {
        setIsActive(value);

        //Aqui generalmente va el llamado a una API
        console.log("Nuevo estado", value)
    }
    
    // Handle eventos. 
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
   
   const handleSubmit = async (e) => {
       
       e.preventDefault();
       console.log("handleSubmit ejecutado") //
        //Se valida el objeto formData usando el esquema definido con Zod
        // safeParse devuelve un objeto indicando si la validacion fue exitosa o no
        const result = userShema.safeParse(formData);
       console.log("Resultado Zod:", result)
        //Si la validacion falla
        if (!result.success) {
            const fieldErrors = {};

            //Zod devuelve los errores en un arreglo llamado issues
            //se recorren para asociar cada error a su campo correspondiente
            result.error.issues.forEach((issue) => {

                //Se guarda el mensaje de error en el objeto fieldErrors
                fieldErrors[issue.path[0]] = issue.message
            });

            //Se actualiza el estado de errores para mostrarlos en el formulario
            setErrors(fieldErrors);
            //Se detiene la ejecucion porque el formulario tiene errores
            return;
        }
        //Si la validacion es exitosa se limpian los errores anteriores
        setErrors({})

        try {
            Alert.loading("Creando usuario...")
            const newUser = await createUser(result.data)

            // Si hay tarea pendiente, crearla ahora que el usuario ya existe
            let taskFailed = false
            if (pendingTask) {
                try {
                    Alert.loading("Registrando tarea...")
                    await createTaskForUser(newUser.id, pendingTask)
                } catch {
                    taskFailed = true
                }
            }

            Alert.close()
            if (taskFailed) {
                await Alert.success(
                    "Usuario creado",
                    "El usuario fue creado, pero la tarea no pudo registrarse. Puedes agregarla desde el perfil del usuario."
                )
            } else {
                await Alert.success(
                    "Usuario creado",
                    pendingTask
                        ? "El usuario y su tarea fueron registrados exitosamente"
                        : "La contraseña fue enviada al correo del usuario"
                )
            }
            navigate("/dashboard/user-list")

        } catch (error) {
            Alert.close()
            Alert.error("Error al crear usuario", error.message)
        }
    }

    return (
        <div className="flex flex-col place-items-center justify-items-center relative">

            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">
                {/* contenenedor del titulo y la linea */}
                <div className=" mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <UserRoundPlus  className="text-brand"/>
                        Registro de usuario
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="grid grid-cols-1 w-fit items-center justify-center gap-2 " onSubmit={handleSubmit} noValidate>
                    {/* noValidate es para quitar las validaciones automaticas de html del navegador */}
                    {/* Inputs */}
                    <div className="lg:grid lg:grid-cols-3 md:grid md:grid-cols-2 gap-x-6 gap-y-1 my-0 mx-auto grid grid-cols-1 items-start">
                        <Select
                            label="Tipo de documento"
                            name="userDocumentType"
                            options={documentTypes}
                            value={formData.userDocumentType}
                            onChange={handleChange}
                            error={errors.userDocumentType}
                            required
                        />
                        <div className="flex flex-col place-items-center md:row-span-2 lg:col-start-2 lg:row-start-1 lg:row-span-2">
                            <h2 className="font-bold text-medium">
                                Foto de perfil
                            </h2>
                            <div className="flex flex-col gap-2 place-items-center text-center">
                                <h2 className="w-70 text-text-muted text-small text-center">1 archivo: PDF, PNG, JPG. Máx 10MB.</h2>
                                <FileInput
                                    value={formData.userImage}
                                    onChange={(files) =>
                                        setFormData((prev) => ({ ...prev, userImage: files }))
                                    }
                                    multiple={false}
                                />
                                {errors.userImage && (
                                    <span className="text-red-800 text-sm">{errors.userImage}</span>
                                )}
                            </div>
                        </div>
                        <Input
                            placeholder="Numero de documento"
                            name= "userDocument"
                            label="Numero de documento"
                            value={formData.userDocument}
                            onChange={handleChange}
                            error={errors.userDocument}
                            required
                        />
                        {/* Grupo: select + botón crear al lado */}
                        <div className="flex flex-col gap-1 w-80">
                            <div className="flex items-end gap-1">
                                <MultiSelect
                                    label="Grupo"
                                    name="userType"
                                    required
                                    options={userTypes}
                                    value={formData.userType}
                                    //como este componente no tiene target se debe configurar el dormato de envío del array
                                    onChange={(name, newValue) => {
                                        setFormData(prevData => ({
                                            ...prevData,
                                            [name]: newValue
                                        }));
                                    }}
                                    error={errors.userType}
                                />
                                <div className="min-w-35">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        type="button"
                                        
                                        onClick={() => setGroupModalOpen(true)}
                                    >
                                        Crear grupo
                                    </Button>

                                </div>
                            </div>
                        </div>
                        <Input
                            placeholder="Dirección"
                            name="userAddres"
                            label="Dirección"
                            value={formData.userAddres}
                            onChange={handleChange}
                            error={errors.userAddres}
                            required
                        />
                        <Input
                            placeholder="Nombre(s)"
                            name="First_name"
                            label="Nombre(s)"
                            value={formData.First_name}
                            onChange={handleChange}
                            error={errors.First_name}
                            required
                        />
                        <Input
                            placeholder="Apellido(s)"
                            name="Last_name"
                            label="Apellido(s)"
                            value={formData.Last_name}
                            onChange={handleChange}
                            error={errors.Last_name}
                            required
                        />
                        <Input
                            placeholder="Número telefónico"
                            type="tel"
                            name="userTel"
                            label="Número telefónico"
                            value={formData.userTel}
                            onChange={handleChange}
                            error={errors.userTel}
                            required
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
                            required
                        />
                        <Input
                            placeholder="Confirmar correo electrónico"
                            type="email"
                            name="userEmailConfir"
                            label="Confirmar correo electrónico"
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
                            {/* Fecha inicio usuario */}
                            <Input
                                type="date"
                                name="userDateStart"
                                label="Fecha inicio"
                                value={formData.userDateStart}
                                onChange={handleChange}
                                error={errors.userDateStart}
                                required
                            />
                            {/* Fecha fin usuario */}
                            <Input
                                type="date"
                                name="userDateEnd"
                                label="Fecha fin"
                                value={formData.userDateEnd}
                                onChange={handleChange}
                                error={errors.userDateEnd}
                                required
                            />
                        
                        <div className="flex place-self-center -items-center justify-center align-middle gap-3">
                            <p className="parrafo-edit-style relative bottom-0.5 items-">¿Es cuentadante?:</p>
                            {/* Switch */}
                            <StatusSwitch
                                checked={isActive}
                                onChange={handleChange}
                                size="md"
                                // inline-flex -> ocupa el espacio asignado
                                className="inline-flex"
                                value={formData.is_accountant}
                            />
                        </div>

                        <div className="flex flex-col items-end justify-end gap-4">
                            <Button
                                variant="primary"
                                size="sm"
                                type="button"
                                onClick={() => setTaskModalOpen(true)}
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

            {groupModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setGroupModalOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GroupCreateModalPage
                            onClose={() => setGroupModalOpen(false)}
                            onGroupCreated={(newGroup) => {
                                // Agrega el nuevo grupo al select y lo deja seleccionado
                                setUserTypes(prev => [...prev, newGroup])
                                setFormData(prev => ({ ...prev, userType: String(newGroup.value) }))
                                setGroupModalOpen(false)
                            }}
                        />
                    </div>
                </div>
            )}

            {taskModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setTaskModalOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskCreateModal
                            deferred
                            onClose={() => setTaskModalOpen(false)}
                            onTaskCreated={(newTask) => setPendingTask(newTask)}
                        />
                    </div>
                </div>
            )}
        </div>

    )
};