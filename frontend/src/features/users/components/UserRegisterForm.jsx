import { Input, Button, IconButton, Select, StatusSwitch, FileInput, MultiSelect, Checkbox, Modal } from "@/shared"
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
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM } from "@/features/permissions/config/perms";
import {
    grupoSinVencimiento,
    FECHA_FIN_CENTINELA,
    TEXTO_FECHA_INDEFINIDA,
} from "../config/indefiniteEndDate";

// Devuelve la fecha local actual en formato YYYY-MM-DD.
// Se usa getFullYear/Month/Date en vez de toISOString() porque toISOString()
// retorna la fecha en UTC, lo cual en Colombia (UTC-5) puede devolver
// el día siguiente a partir de las 7 PM hora local.
const localToday = () => {
    const d = new Date()
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
    ].join("-")
}

export default function UserRegisterForm() {
    const navigate = useNavigate();
    const { hasPerm } = usePermissions();
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
        is_staff: false,
        // Autorización de tratamiento de datos (Ley 1581 de 2012). No se
        // guarda en la base de datos, solo habilita el envío del formulario.
        aceptaTratamientoDatos: false,
        userImage: []
    });
    // Modal informativo de la política de tratamiento de datos
    const [datosModalOpen, setDatosModalOpen] = useState(false);
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

    // Los grupos de planta (Administrador, Instructor de Planta) no llevan
    // fecha de fin. El campo se esconde y se envía una fecha centinela; el
    // backend igual la fuerza por su cuenta.
    const sinVencimiento = grupoSinVencimiento(formData.userType, userTypes);

    // Mantiene el valor del formulario alineado con el grupo elegido, para que
    // Zod no falle por "fecha fin obligatoria" cuando el campo está escondido.
    useEffect(() => {
        setFormData(prev => {
            if (sinVencimiento) {
                return prev.userDateEnd === FECHA_FIN_CENTINELA
                    ? prev
                    : { ...prev, userDateEnd: FECHA_FIN_CENTINELA };
            }
            // Al quitar el grupo de planta se limpia la centinela para que el
            // administrador escriba una fecha real
            return prev.userDateEnd === FECHA_FIN_CENTINELA
                ? { ...prev, userDateEnd: "" }
                : prev;
        });
    }, [sinVencimiento]);
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
                            {/* Fecha inicio usuario — min=hoy para no permitir fechas pasadas */}
                            <Input
                                type="date"
                                name="userDateStart"
                                label="Fecha inicio"
                                value={formData.userDateStart}
                                onChange={handleChange}
                                error={errors.userDateStart}
                                min={localToday()}
                                required
                            />
                            {/* Fecha fin usuario — se esconde para los grupos de planta,
                                que no tienen vencimiento */}
                            {sinVencimiento ? (
                                <div className="flex flex-col gap-1 w-80">
                                    <span className="text-caption font-label">Fecha fin</span>
                                    <div className="h-10 flex items-center px-3 rounded-2xl bg-background-dropdown text-text-muted text-small font-semibold">
                                        {TEXTO_FECHA_INDEFINIDA}
                                    </div>
                                    <span className="text-small text-text-muted">
                                        Los usuarios de este grupo no tienen fecha de finalización.
                                    </span>
                                </div>
                            ) : (
                                <Input
                                    type="date"
                                    name="userDateEnd"
                                    label="Fecha fin"
                                    value={formData.userDateEnd}
                                    onChange={handleChange}
                                    error={errors.userDateEnd}
                                    min={localToday()}
                                    required
                                />
                            )}
                        
                       
                        <div className="gap-2 flex justify-between">
                            <div className="flex place-self-center items-center justify-center gap-3">
                                <p className="parrafo-edit-style relative bottom-0.5">¿Es cuentadante?:</p>
                                <StatusSwitch
                                    checked={formData.is_accountant}
                                    onChange={(val) => setFormData(prev => ({ ...prev, is_accountant: val }))}
                                    size="md"
                                    className="inline-flex"
                                />
                            </div>

                            <div className="flex place-self-center items-center justify-center gap-3">
                                <p className="parrafo-edit-style relative bottom-0.5">¿Es Staff?:</p>
                                <StatusSwitch
                                    checked={formData.is_staff}
                                    onChange={(val) => setFormData(prev => ({ ...prev, is_staff: val }))}
                                    size="md"
                                    className="inline-flex"
                                />
                            </div>
                        </div>

                        {/* Autorización de tratamiento de datos — obligatoria.
                            El texto va como botón aparte y NO dentro del label
                            del Checkbox: si estuviera dentro, al hacer clic
                            para leer la política se marcaría la casilla. */}
                        <div className="flex flex-col place-self-center items-center gap-1">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="aceptaTratamientoDatos"
                                    name="aceptaTratamientoDatos"
                                    checked={formData.aceptaTratamientoDatos}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            aceptaTratamientoDatos: e.target.checked,
                                        }))
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setDatosModalOpen(true)}
                                    className="text-small text-text-primary underline hover:opacity-70 transition-opacity text-left"
                                >
                                    Acepto tratamiento de datos personales <span className="text-error">*</span>
                                </button>
                            </div>
                            {errors.aceptaTratamientoDatos && (
                                <span className="text-red-800 text-caption">
                                    {errors.aceptaTratamientoDatos}
                                </span>
                            )}
                        </div>

                        {/* Agregar tarea requiere el permiso propio de tareas */}
                        {hasPerm(PERM.TASK_ADD) && (
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
                        )}
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

            {/* Política de tratamiento de datos personales */}
            {datosModalOpen && (
                <Modal
                    title="Tratamiento de datos personales"
                    titleVariant="gradient"
                    cancelLabel="Cerrar"
                    onClose={() => setDatosModalOpen(false)}
                >
                    <div className="flex flex-col gap-4">
                        <p className="text-body text-text-primary text-justify">
                            De acuerdo con La Ley 1581 de 2012, Protección de Datos
                            Personales, el Servicio Nacional de Aprendizaje SENA, se
                            compromete a garantizar la seguridad y protección de los
                            datos personales que se encuentran almacenados en este
                            documento, y les dará el tratamiento correspondiente en
                            cumplimiento de lo establecido legalmente.
                        </p>

                        {/* rel="noopener noreferrer" evita que la pestaña nueva
                            pueda manipular esta ventana */}
                        <a
                            href="https://www.sena.edu.co/es-co/transparencia/Paginas/habeas_data.aspx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-small text-brand underline break-all hover:opacity-70 transition-opacity"
                        >
                            https://www.sena.edu.co/es-co/transparencia/Paginas/habeas_data.aspx
                        </a>
                    </div>
                </Modal>
            )}
        </div>

    )
};