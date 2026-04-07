import { Input, Button, IconButton } from "@/shared"
import React, {useState} from "react";

export default function ReturnableRegisterForm() {
    const [formData, setFormData] = useState({
        placa: "",
        serial: "",
        marca: "",
        modelo:"",
        nombreElemento: "",
        cuentadante: "",
        descripcion: "",
        categoria: "",
        estado: "",
        cantidad: "",
        valorUnitario: "",
        valorTotal: "",
        ubicacion: "",
        dimensiones: "",
    });
    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor cuando uno sale del campo

    const handleMaterialChange = (e) => {
        console.log("Nombre: ", e.target.value);
    }
    
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
            <div className="bg-gradient-container-green border-4 border-border-green-container p-10 rounded-4xl ">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max ">
                    <h1 className="text-gradient-title text-2xl pb-0.5">
                        Crear material
                    </h1>{/*linea degradada del titulo*/}
                    <h1 className="text-gradient-title text-2xl pb-0.5">
                        devolutivo
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="grid grid-cols-2 justify-end items-center gap-10 -mt-18">
                    <div>
                        <div className="mt-6" >
                            agregar imagen del elemento
                        </div>
                        <Input
                            // Si no se le agrega el tipo esque por defecto es text
                            placeholder="subir imagen"
                            type="imagen"
                            onBlur={handleBlur}
                            name= "img"
                        />
                       
                        <div className="mt-6">
                            agregar ficha técnica
                        </div>
                            
                        <div className="mt-6">
                                <Button
                                    variant="primary"
                                    size="sm"
                                >
                                    Agregar telefono
                                </Button>
                        
                            </div>
                        
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-10 ">
                        <div className="flex flex-col gap-6">
                            <Input
                                // Si no se le agrega el tipe esque por defecto es text
                                placeholder="Placa Sena"
                                onBlur={handleBlur}
                                name= "plate"
                            />
                            <Input
                                placeholder="Serial"
                                onBlur={handleBlur}
                                name="serial"
                            />
                            <Input
                                placeholder="Marca"
                                onChange={handleMaterialChange}
                                name="brand"
                            />
                            <Input
                                placeholder="Modelo"
                                onBlur={handleBlur}
                                name="model"
                            />
                            <Input
                                placeholder="Nombre del elemento"
                                type="name"
                                onChange={handleMaterialChange}
                                name="element"
                            />
                            <Input
                                placeholder="Seleccione cuentadante"
                                type="name"
                                onBlur={handleBlur}
                                name="select"
                            />
                            <Input
                                placeholder="Descripcion"
                                onBlur={handleBlur}
                                name=" Description"
                            />

                        </div>
                        
                        <div className="flex flex-col gap-6">
                            <Input
                                placeholder="Categoria"
                                onChange={handleMaterialChange}
                                name="category"
                            />

                            <Input
                                placeholder="Estado"
                                onChange={handleMaterialChange}
                                name="state"
                            />
                            
                            <Input
                                placeholder="Cantidad"
                                type="number"
                                name="amount"
                            />
                            <Input
                                placeholder="Valor unitario"
                                type="number"
                                name="unitValue"
                            />
                            <Input
                                placeholder="Valor total"
                                type="number"
                                name="totalVlue"
                            />
                            <Input
                                placeholder="Ubicacion"
                                onBlur={handleBlur}
                                name="location"
                            />

                            <Input
                                placeholder="Dimensiones"
                                onBlur={handleBlur}
                                name="Dimensions"
                            />

                            {/* Acciones */}
                            <div className="flex justify-end mt-22">
                                <IconButton
                                    variant="primary"
                                    size="md"
                                >
                                    Crear
                                </IconButton>
                            </div>

                        </div>
                        
                    </div>
                </form>
            </div>

        </div>
    )
};