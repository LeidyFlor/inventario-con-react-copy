import { Input, Button, IconButton, Select } from "@/shared"
import React, {useState, useEffect} from "react";
import { getDocumentTypes, getUserTypes } from "@/features/users/services/selectService";

export default function UserRegisterForm() {
    const [formData, setFormData] = useState({
        documento: "",
        nombre: "",
        email: "",
        direccion:"",
        telefono: "",
        password: "",
        userType: "",
    });
    // useState que me trae el arreglo mediante el get en servicios
    const [documentTypes, setDocumentTypes] = useState([]);
    const [userTypes, setUserTypes] = useState([]);

    useEffect(() => {
        getDocumentTypes().then(setDocumentTypes);
        getUserTypes().then(setUserTypes);
    },[]); //los [] es para que al menos se ejecute una vez, no tiene dependencia
    
    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor cuando uno sale del campo
    const handleNameChange = (e) => {
        console.log("Nombre: ", e.target.value);
    }
    // const handleBlur = (e) => {
    //     console.log("Email: ", e.target.value);
    // }
    const handleBlur = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name] : value //con name react sabe que campo actualizar
        })
        console.log("Input ", e.target.value);
    }


    return (
        <div>
            <div className="mb-10">
                <Button
                    variant="secondary"
                    size="sm"
                >
                    Atrás
                </Button>

            </div>
            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-10 rounded-4xl">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5">
                        Registro de usuario
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="grid grid-cols-1 items-center gap-10 ">
                    {/* Inputs */}
                    <div className="grid grid-cols-3 gap-3 my-0 mx-auto">
                        <Select
                            label="Tipo de documento"
                            name="documentType"
                            options={documentTypes}
                        />
                        <Input
                            placeholder="Numero de documento"
                            type="number"
                            onBlur={handleBlur}
                            name= "documento"
                            label="Numero de documento"
                        />
                        <Select
                            label="Tipo de usuario"
                            name="userType"
                            options={userTypes}
                        />
                        <Input
                            placeholder="Ingrese su nombre"
                            onChange={handleNameChange}
                            name="nombre"
                            label="Nombre completo"
                        />
                        <Input
                            placeholder="Dirección"
                            onBlur={handleBlur}
                            name="direccion"
                            label="Dirección"
                        />
                        <Input
                            placeholder="Número telefónico"
                            type="tel"
                            onBlur={handleBlur}
                            name="telefono"
                            label="Número telefónico"
                        />
                        <Input
                            placeholder="Número telefónico 2"
                            type="tel"
                            onBlur={handleBlur}
                            name="telefono2"
                            label="Número telefónico 2"
                        />
                        <Input
                            placeholder="Correo electrónico"
                            type="email"
                            onBlur={handleBlur}
                            name="email"
                            label="Correo electrónico"
                        />
                        <Input
                            placeholder="Confirmar correo electrónico"
                            type="email"
                            name="emailconfir"
                            label="Confirmar correo electrónico"
                        />
                        <Input
                            placeholder="Correo institucional"
                            type="email"
                            onBlur={handleBlur}
                            name="email2"
                            label="Correo institucional"
                        />
                        <Input
                            placeholder="Ingrese su contraseña"
                            type="password"
                            name="password"
                            label="Contraseña"
                        />

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
                        >
                            Crear
                        </IconButton>
                    </div> 
            </form>
            </div>

        </div>
    )
};