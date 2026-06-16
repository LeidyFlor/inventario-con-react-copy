import { Input, Button, IconButton, Select, FileInput, Textarea } from "@/shared"
import React, {useState, useEffect} from "react";
import { getMaterialState, getUserName, getBrandName } from "@/features/consumable-material/services/selectService.js";
import { consumableMaterialShema } from "../schemas/consumableMaterialShema";
// Para el icon
import { Cable } from "lucide-react";

export default function ConsumableRegisterForm() {
    const [formData, setFormData] = useState({
        materialBarcodeSena: "",
        brandName: "",
        materialName: "",
        inventoryManger: "",
        materialDescription: "",
        materialState: "",
        materialQuantity: "",
        materialUnitPrice: "",
        materialTotalPrice: "",
        materialLocation: "",
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
            console.log("Material valido:", result.data);
        }
    return (
        <div className="flex flex-col place-items-center justify-items-center relative">
            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit mt-2 h-fit">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max ">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Cable className="text-brand"/>
                        Crear material de Consumo
                    </h1>

                    {/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="grid md:grid-flow-col-dense items-center gap-10  " onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col md:flex-row justify-center items-center">
                        <div className="flex flex-col place-items-center">
                            <h2 className="mb-6 font-bold text-body">
                                Agregar imagen del elemento
                            </h2>
                            {/* Contenedor fileInput Imagen del archivo. tipo de arhcivo, cantidad y tamano */}
                            <div className="flex flex-col gap-4 place-items-center">
                                <h2 className="w-80">Puede subir 1 archivo, archivos permitidos: PDF, PNG, JPG. Máximo de 10MB</h2>
                                <FileInput
                                    value={formData.returnnableMaterialImagen}
                                    onChange={(files) =>
                                    setFormData((prev) => ({ ...prev, returnnableMaterialImagen: files }))
                                    }
                                    multiple={false}
                                />
                                {errors.returnnableMaterialImagen && (
                                <span className="text-red-800 text-sm">{errors.returnnableMaterialImagen}</span>
                                )}
                    
                            </div>
                    
                                               
                        </div>
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-10">
                        <div className="flex flex-col gap-4">
                            <Input
                                placeholder="Placa Sena"
                                name= "materialBarcodeSena"
                                label="Placa Sena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                            />
                            <Select
                                label="Marca"
                                options={brandName}
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                error={errors.brandName}
                            />
                            <Input
                                placeholder="Nombre del elemento"
                                name="materialName"
                                label="Nombre del elemento"
                                value={formData.materialName}
                                onChange={handleChange}
                                error={errors.materialName}
                            />
                            <Select
                                label="Seleccione cuentadante"
                                options={userName}
                                name="inventoryManger"
                                value={formData.inventoryManger}
                                onChange={handleChange}
                                error={errors.inventoryManger}
                            />
                            <Textarea
                                className="mb-3 mb:mb-0"
                                label="Descripción"
                                placeholder="Descripción"
                                name="materialDescription"
                                value={formData.materialDescription}
                                onChange={handleChange}
                                error={errors.materialDescription}
                            />

                        </div>
                        <div className="flex flex-col gap-3">
                            <Select
                                label="Estado"
                                options={materialState}
                                name="materialState"
                                value={formData.materialState}
                                onChange={handleChange}
                                error={errors.materialState}
                            />
                            <Input
                                placeholder="Cantidad"
                                type="number"
                                name="materialQuantity"
                                label="Cantidad"
                                value={formData.materialQuantity}
                                onChange={handleChange}
                                error={errors.materialQuantity}
                            />
                            <Input
                                placeholder="Valor unitario"
                                type="number"
                                name="materialUnitPrice"
                                label= "Valor unitario"
                                value={formData.materialUnitPrice}
                                onChange={handleChange}
                                error={errors.materialUnitPrice}
                            />
                            <Input
                                placeholder="Valor total"
                                type="number"
                                name="materialTotalPrice"
                                label="Valor total"
                                value={formData.materialTotalPrice}
                                onChange={handleChange}
                                error={errors.materialTotalPrice}
                            />
                            <Input
                                placeholder="Ubicación"
                                name="materialLocation"
                                label="Ubicación"
                                value={formData.materialLocation}
                                onChange={handleChange}
                                error={errors.materialLocation}
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