import { Input, Button, IconButton } from "@/shared"
import React, {useState} from "react";

export default function UserRegisterForm() {
    const [formData, setFormData] = useState({
        documento: "",
        nombre: "",
        email: "",
        direccion:"",
        telefono: "",
        password: "",
    });
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
            <h1 className="text-primary text-2xl mb-6">
                Registro de usuario
            </h1>
            <form className="grid grid-cols-1 items-center gap-6 ">
                {/* Inputs */}
                <div className="grid grid-cols-2 gap-6 my-0 mx-auto">
                    <Input
                        placeholder="Numero de documento"
                        type="number"
                        onBlur={handleBlur}
                        name= "documento"
                    />
                    <Input
                        placeholder="Ingrese su nombre"
                        onChange={handleNameChange}
                        name="nombre"
                    />
                    <Input
                        placeholder="Direccion"
                        onBlur={handleBlur}
                        name="direccion"
                    />
                    <Input
                        placeholder="Número telefónico"
                        type="tel"
                        onBlur={handleBlur}
                        name="telefono"
                    />
                    <Input
                        placeholder="Número telefónico 2"
                        type="tel"
                        onBlur={handleBlur}
                        name="telefono2"
                    />
                    <Input
                        placeholder="Correo electrónico"
                        type="email"
                        onBlur={handleBlur}
                        name="email"
                    />
                    <Input
                        placeholder="Confirmar correo electrónico"
                        type="email"
                        name="emailconfir"
                    />
                    <Input
                        placeholder="Correo institucional"
                        type="email"
                        onBlur={handleBlur}
                        name="email2"
                    />
                    <Input
                        placeholder="Ingrese su contraseña"
                        type="password"
                        name="password"
                    />

                    {/* Acciones */}
                    <div className="flex items-end justify-end gap-12">
                        <Button
                            variant="secondary"
                            size="sm"
                        >
                            Cancelar
                        </Button>

                        

                        <IconButton
                            variant="primary"
                            size="md"
                        >
                            Crear
                        </IconButton>

                    </div>
                </div>


            </form>

        </div>
    )
};