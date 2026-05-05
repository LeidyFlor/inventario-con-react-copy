import { Input, Button, IconButton, Select } from "@/shared"
import React, { useState, useEffect } from "react";
import { getMaterialState, getUserName, getBrandName } from "@/features/consumable-material/services/selectService.js";
import { consumableMaterialShema } from "../schemas/consumableMaterialShema";

export default function ReturnableEditForm() {
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
    return(
        <div className="flex flex-col place-items-center justify-items-center relative">

            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl  w-fit mt-2">
                {/* contenenedor del titulo y la linea */}
                <div className="mb-6 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5">
                        Editar Material
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <form className="flex items-center gap-x-10" onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col gap-5">
                        <Input
                            placeholder="subir imagen"
                            type="image"
                            name="materialPhoto"
                        />
                        <Input
                            placeholder="Alicate"
                            name="materialName"
                            value={formData.materialName}
                            onChange={handleChange}
                            error={errors.materialName}
                            variant="nameEdit"
                        />
                        <Input
                            placeholder="Alicate descripcion"
                            name="materialDescription"
                            value={formData.materialDescription}
                            onChange={handleChange}
                            error={errors.materialDescription}
                        />
                        <div className="flex gap-10 place-items-center justify-center">
                            <h3 className="font-semibold text-medium">Habilitar / Deshabilitar</h3>
                            <Button
                                variant="warning"
                                size="sm"
                            >
                                Editar
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-dense items-center gap-10 bg-background border-2 border-border-edit-informaion p-8 rounded-xl">
                        <div className="grid grid-cols-2 items-center 4">
                            <p className="parrafo-edit-style">Placa sena:</p>
                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Marca:</p>
                            <Select
                                options={brandName}
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                error={errors.brandName}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Cuentadante:</p>
                            <Select
                                options={userName}
                                name="inventoryManger"
                                value={formData.inventoryManger}
                                onChange={handleChange}
                                error={errors.inventoryManger}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Cantidad:</p>
                            <Input
                                type="number"
                                name="materialQuantity"
                                value={formData.materialQuantity}
                                onChange={handleChange}
                                error={errors.materialQuantity}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Valor unitario:</p>
                            <Input
                                type="number"
                                name="materialUnitPrice"
                                value={formData.materialUnitPrice}
                                onChange={handleChange}
                                error={errors.materialUnitPrice}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Valor total:</p>
                            <Input
                                type="number"
                                name="materialTotalPrice"
                                value={formData.materialTotalPrice}
                                onChange={handleChange}
                                error={errors.materialTotalPrice}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Ubicación:</p>
                            <Input
                                name="materialLocation"
                                value={formData.materialLocation}
                                onChange={handleChange}
                                error={errors.materialLocation}
                                variant="isEdit"
                            />
                            <p className="parrafo-edit-style">Estado:</p>
                            <Select
                                options={materialState}
                                name="materialState"
                                value={formData.materialState}
                                onChange={handleChange}
                                error={errors.materialState}
                                variant="isEdit"
                            />
                            
                            {/* botones de accion */}
                            <div className="place-items-start">
                                <Button
                                    variant="secondary"
                                    size="sm"
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
                    <div>

                    </div>
                </form>

            </div>
        </div>
    )
}