import { Input, Button, IconButton, Select } from "@/shared"
import React, {useState, useEffect} from "react";
import { getMaterialCategory, getMaterialState, getUserName, getBrandName } from "@/features/returnable-material/services/selectService.js";

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

    const [materialCategory, setMaterialCategory] = useState([]);
    const [materialState, setMaterialState] = useState([]);
    const [userName, setUserName] = useState([]);
    const [brandName, setBrandName] = useState([]);

    useEffect(() => {
        getMaterialCategory().then(setMaterialCategory);
        getMaterialState().then(setMaterialState);
        getUserName().then(setUserName);
        getBrandName().then(setBrandName);
    }, [])
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
                    <h1 className="text-gradient-title text-h3 pb-0.5">
                        Crear material devolutivo
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                {/* grid-flow-col-dense para ajustar el ancho de las columanas al contenido */}
                <form className="grid grid-flow-col-dense justify-end items-center gap-10 -mt-18">
                    <div className="flex justify-center items-center h-screen">
                        <div className="flex flex-col">
                            <h2 className="mb-6 font-bold text-body">
                                Agregar imagen del elemento
                            </h2>
                            <Input
                            placeholder="subir imagen"
                            type="image"
                            onBlur={handleBlur}
                            name="imagen"
                            />

                            <h2 className="mt-6 font-bold text-body">
                            Agregar ficha técnica
                            </h2>

                            <div className="mt-6">
                            <Button variant="primary" size="sm">
                                Agregar
                            </Button>
                            </div>
                        </div>
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-10 ">
                        <div className="flex flex-col gap-3">
                            <Input
                                // Si no se le agrega el type esque por defecto es text
                                placeholder="Placa Sena"
                                onBlur={handleBlur}
                                name= "placa"
                                label= "Placa Sena"
                            />
                            <Input
                                placeholder="Serial"
                                onBlur={handleBlur}
                                name="serial"
                                label="Serial"
                            />
                            <Select
                                label="Marca"
                                options={brandName}
                                name="marca"
                            />
                            <Input
                                placeholder="Modelo"
                                onBlur={handleBlur}
                                name="modelo"
                                label="Modelo"
                            />
                            <Input
                                placeholder="Nombre del elemento"
                                type="name"
                                onChange={handleMaterialChange}
                                name="nombreElemento"
                                label="Nombre del elemento"
                            />
                            <Select
                                label="Seleccione cuentadante"
                                options={userName}
                                name="cuentadante"
                            />
                            <Input
                                placeholder="Descripción"
                                onBlur={handleBlur}
                                name="description"
                                label="Descripción"
                            />

                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <Select
                                label="Categoría"
                                options={materialCategory}
                                name="categoria"
                            />

                            <Select
                                label="Estado"
                                options={materialState}
                                name="estado"
                            />
                            
                            <Input
                                placeholder="Cantidad"
                                type="number"
                                name="cantidad"
                                label="Cantidad"
                            />
                            <Input
                                placeholder="Valor unitario"
                                type="number"
                                name="valorUnitario"
                                label="Valor unitario"
                            />
                            <Input
                                placeholder="Valor total"
                                type="number"
                                name="valorTotal"
                                label="Valor total"
                            />
                            <Input
                                placeholder="Ubicacion"
                                onBlur={handleBlur}
                                name="ubicacion"
                                label="Ubicación"
                            />

                            <Input
                                placeholder="Dimensiones"
                                onBlur={handleBlur}
                                name="dimensiones"
                                label="Dimensiones"
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