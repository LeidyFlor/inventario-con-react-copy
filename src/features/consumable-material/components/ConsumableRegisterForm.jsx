import { Input, Button, IconButton, Select } from "@/shared"
import React, {useState, useEffect} from "react";
import { getMaterialState, getUserName, getBrandName } from "@/features/consumable-material/services/selectService.js";
import { consumableMaterialShema } from "../schemas/consumableMaterialShema";

export default function ConsumableRegisterForm() {
    const [formData, setFormData] = useState({
        placaMaterial: "",
        marcaMaterial: "",
        nombreElementoMaterial: "",
        cuentadanteMaterial: "",
        descripcionMaterial: "",
        estadoMaterial: "",
        cantidadMaterial: "",
        valorUnitarioMaterial: "",
        valorTotalMaterial: "",
        ubicacionMaterial: "",
    });
    const [errors, setErrors] = useState({});
    const [materialState, setMaterialState] = useState([]);
    const [userName, setUserName] = useState([]); //use state para cuentadante
    const [brandName, setBrandName] = useState([]);

    useEffect(() => {
        getMaterialState().then(setMaterialState);
        getUserName().then(setUserName);
        getBrandName().then(setBrandName);
    }, []); //los [] es para que al menos se ejecute una vez, no tiene dependencia
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
            const result = consumableMaterialShema.safeParse(formData);
    
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
                    <h1 className="text-gradient-title text-h3 pb-0.5 text-center">
                        Crear material de Consumo
                    </h1>

                    {/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line mb-30"></div>

                </div>
                <form className="grid grid-flow-col-dense justify-end items-center gap-10 -mt-18 " onSubmit={handleSubmit} noValidate>
                    <div>
                        <h2 className="mb-6 font-bold text-body" >
                            Agregar imagen del elemento
                        </h2>
                        <Input
                            type="image"
                            name= "img"
                        />
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-10 ">
                        <div className="flex flex-col gap-3">
                            <Input
                                placeholder="Placa Sena"
                                name= "placaMaterial"
                                label="Placa Sena"
                                value={formData.placaMaterial}
                                onChange={handleChange}
                                error={errors.placaMaterial}
                            />
                            <Select
                                label="Marca"
                                options={brandName}
                                name="marcaMaterial"
                                value={formData.marcaMaterial}
                                onChange={handleChange}
                                error={errors.marcaMaterial}
                            />
                            <Input
                                placeholder="Nombre del elemento"
                                name="nombreElementoMaterial"
                                label="Nombre del elemento"
                                value={formData.nombreElementoMaterial}
                                onChange={handleChange}
                                error={errors.nombreElementoMaterial}
                            />
                            <Select
                                label="Seleccione cuentadante"
                                options={userName}
                                name="cuentadanteMaterial"
                                value={formData.cuentadanteMaterial}
                                onChange={handleChange}
                                error={errors.cuentadanteMaterial}
                            />
                            <Input
                                placeholder="Descripción"
                                name="descripcionMaterial"
                                label="Descipción"
                                value={formData.descripcionMaterial}
                                onChange={handleChange}
                                error={errors.descripcionMaterial}
                            />

                        </div>
                        <div className="flex flex-col gap-3">
                            <Select
                                label="Estado"
                                options={materialState}
                                name="estadoMaterial"
                                value={formData.estadoMaterial}
                                onChange={handleChange}
                                error={errors.estadoMaterial}
                            />
                            <Input
                                placeholder="Cantidad"
                                type="number"
                                name="cantidadMaterial"
                                label="Cantidad"
                                value={formData.cantidadMaterial}
                                onChange={handleChange}
                                error={errors.cantidadMaterial}
                            />
                            <Input
                                placeholder="Valor unitario"
                                type="number"
                                name="valorUnitarioMaterial"
                                label= "Valor unitario"
                                value={formData.valorUnitarioMaterial}
                                onChange={handleChange}
                                error={errors.valorUnitarioMaterial}
                            />
                            <Input
                                placeholder="Valor total"
                                type="number"
                                name="valorTotalMaterial"
                                label="Valor total"
                                value={formData.valorTotalMaterial}
                                onChange={handleChange}
                                error={errors.valorTotalMaterial}
                            />
                            <Input
                                placeholder="Ubicación"
                                name="ubicacionMaterial"
                                label="Ubicación"
                                value={formData.ubicacionMaterial}
                                onChange={handleChange}
                                error={errors.ubicacionMaterial}
                            />

                            {/* Acciones */}
                            <div className="flex justify-end mt-22">
                                <IconButton
                                    variant="primary"
                                    size="md"
                                    type="submit"
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