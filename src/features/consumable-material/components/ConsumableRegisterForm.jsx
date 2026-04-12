import { Input, Button, IconButton, Select } from "@/shared"
import React, {useState, useEffect} from "react";
import { getMaterialState, getUserName, getBrandName } from "@/features/consumable-material/services/selectService.js";

export default function ConsumableRegisterForm() {
    const [formData, setFormData] = useState({
        placa: "",
        serial: "",
        marca: "",
        modelo:"",
        nombreElemento: "",
        cuentadante: "",
        descripcion: "",
        estado: "",
        cantidad: "",
        valorUnitario: "",
        valorTotal: "",
        ubicacion: "",
    });
    const [materialState, setMaterialState] = useState([]);
    const [userName, setUserName] = useState([]); //use state para cuentadante
    const [brandName, setBrandName] = useState([]);

    useEffect(() => {
        getMaterialState().then(setMaterialState);
        getUserName().then(setUserName);
        getBrandName().then(setBrandName);
    }, []); //los [] es para que al menos se ejecute una vez, no tiene dependencia
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
                    <h1 className="text-gradient-title text-2xl pb-0.5 text-center">
                        Crear material de <br/> Consumo
                    </h1>

                    {/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line mb-30"></div>

                </div>
                <form className="grid grid-flow-col-dense justify-end items-center gap-10 -mt-18 ">
                    <div>
                        <h2 className="mb-6 font-bold" >
                            Agregar imagen del elemento
                        </h2>
                        <Input
                            // Si no se le agrega el tipo esque por defecto es text
                            placeholder="Subir imagen"
                            type="image"
                            onBlur={handleBlur}
                            name= "img"
                            
                        />
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-10 ">
                        <div className="flex flex-col gap-6">
                            <Input
                                // Si no se le agrega el tipo esque por defecto es text
                                placeholder="Placa Sena"
                                onBlur={handleBlur}
                                name= "placa"
                            />
                            <Input
                                placeholder="Serial"
                                onBlur={handleBlur}
                                name="serial"
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
                            />
                            <Input
                                placeholder="Nombre del elemento"
                                type="name"
                                onChange={handleMaterialChange}
                                name="nombreElemento"
                            />
                            <Select
                                label="Seleccione cuentadante"
                                options={userName}
                                name="cuentadante"
                            />
                            <Input
                                placeholder="Descripcion"
                                onBlur={handleBlur}
                                name="descripcion"
                            />

                        </div>
                        <div className="flex flex-col gap-6">
                            <Select
                                label="Estado"
                                options={materialState}
                                name="estado"
                            />
                            <Input
                                placeholder="Cantidad"
                                type="number"
                                name="cantidad"
                            />
                            <Input
                                placeholder="Valor unitario"
                                type="number"
                                name="valorUnitario"
                            />
                            <Input
                                placeholder="Valor total"
                                type="number"
                                name="valorTotal"
                            />
                            <Input
                                placeholder="Ubicacion"
                                onBlur={handleBlur}
                                name="ubicacion"
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