import { Input, Button, IconButton, Select, StatusSwitch, FileInput } from "@/shared";
import React, { useState, useEffect } from "react";
import { getMaterialCategory, getMaterialState, getUserName, getBrandName } from "@/features/returnable-material/services/selectService.js";
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema";
import { useParams, useNavigate } from "react-router-dom";
import { returnableMaterial } from "../data/retrunableMaterial";
import { FilePenLine } from "lucide-react";

export default function ReturnableEditForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const material = returnableMaterial.find((m) => m.id === Number(id));

    const [formData, setFormData] = useState({
        materialBarcodeSena: material?.materialBarcodeSena ?? "",
        brandName: material?.brandName ?? "",
        returnableMaterialModel: material?.returnableMaterialModel ?? "",
        materialName: material?.materialName ?? "",
        inventoryManager: material?.inventoryManager ?? "",
        materialDescription: material?.materialDescription ?? "",
        materialState: material?.materialState ?? "",
        materialQuantity: material?.materialQuantity ?? "",
        materialUnitPrice: material?.materialUnitPrice ?? "",
        materialTotalPrice: material?.materialTotalPrice ?? "",
        materialLocation: material?.materialLocation ?? "",
        returnableMaterialSerial: material?.returnableMaterialSerial ?? "",
        returnableMaterialCategory: material?.returnableMaterialCategory ?? "",
        returnableMaterialDimensions: material?.returnableMaterialDimensions ?? "",
        //Campo implementado
        materialImage: material?.materialImage ?? [],
    });

    const [isActive, setIsActive] = useState(material?.is_active ?? true);
    const [errors, setErrors] = useState({});
    const [materialCategory, setMaterialCategory] = useState([]);
    const [materialState, setMaterialState] = useState([]);
    const [userName, setUserName] = useState([]);
    const [brandName, setBrandName] = useState([]);
    const [imagen, setImagen] = useState(material?.materialImage ?? null);
    const [showFileInput, setShowFileInput] = useState(false);

    useEffect(() => {
        getMaterialCategory().then(setMaterialCategory);
        getMaterialState().then(setMaterialState);
        getUserName().then(setUserName);
        getBrandName().then(setBrandName);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const parsedData = {
            ...formData,
            materialQuantity: Number(formData.materialQuantity),
            materialUnitPrice: Number(formData.materialUnitPrice),
            materialTotalPrice: Number(formData.materialTotalPrice),
            is_active: isActive,
        };

        const result = returnableMaterialSchema.safeParse(parsedData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                fieldErrors[field] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        console.log("Material válido:", result.data);
        // SE LLAMA LA API PARA GUARDAR LOS RESULTADOS
    };

    if (!material) return <p>Material no encontrado</p>;

    return (
        <div className="flex flex-col place-items-center justify-items-center w-full">

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full mt-2">

                {/* Contenedor del título y la línea */}
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <FilePenLine className="text-brand" />
                        Editar material devolutivo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form
                    className="flex flex-col lg:grid lg:grid-flow-col-dense items-center gap-8"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {/* Contenedor izquierdo */}
                    <div className="flex flex-col gap-4 place-items-center">

                        {/* Para cuando haga el cambio, y agregar la imagen */}
                        <div className="flex flex-col gap-4 place-items-center">
                            <h2 className="w-80">Puede subir 1 archivo, archivos permitidos: PDF, PNG, JPG. Máximo de 10MB</h2>

                            {imagen ? (
                                <img
                                    src={imagen}
                                    alt={material.materialName}
                                    className="w-48 h-48 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                    <span className="text-2xl font-bold">
                                        {material.materialName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {!showFileInput ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    type="button"
                                    onClick={() => setShowFileInput(true)}
                                >
                                    Cambiar imagen
                                </Button>
                            ) : (
                                <FileInput
                                    value={formData.materialImage ?? []}
                                    onChange={(files) => {
                                        setFormData(prev => ({ ...prev, materialImage: files }));
                                        if (files.length > 0) {
                                            setImagen(URL.createObjectURL(files[0]));
                                            setShowFileInput(false);
                                        }
                                    }}
                                    multiple={false}
                                />
                            )}

                            {errors.materialImage && (
                                <span className="text-red-800 text-sm">{errors.materialImage}</span>
                            )}
                        </div>

                        <Input
                            name="materialName"
                            value={formData.materialName}
                            onChange={handleChange}
                            error={errors.materialName}
                            variant="nameEdit"
                        />

                        <Input
                            name="materialDescription"
                            value={formData.materialDescription}
                            onChange={handleChange}
                            error={errors.materialDescription}
                            variant="nameEdit"
                        />

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-medium">Estado</span>
                                <StatusSwitch
                                    checked={isActive}
                                    onChange={() => setIsActive((prev) => !prev)}
                                    className="inline-flex"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contenedor derecho */}
                    <div className="grid grid-cols-dense items-center gap-10 bg-background border-2 border-border-edit-informaion p-8 rounded-xl">
                        <div className="md:grid md:grid-cols-[130px_1fr] grid auto-cols items-center gap-4">

                            <p className="parrafo-edit-style">Placa SENA:</p>
                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Categoría:</p>
                            <Select
                                options={materialCategory}
                                name="returnableMaterialCategory"
                                value={formData.returnableMaterialCategory}
                                onChange={handleChange}
                                error={errors.returnableMaterialCategory}
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

                            <p className="parrafo-edit-style">Modelo:</p>
                            <Input
                                name="returnableMaterialModel"
                                value={formData.returnableMaterialModel}
                                onChange={handleChange}
                                error={errors.returnableMaterialModel}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Serial:</p>
                            <Input
                                name="returnableMaterialSerial"
                                value={formData.returnableMaterialSerial}
                                onChange={handleChange}
                                error={errors.returnableMaterialSerial}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Cuentadante:</p>
                            <Select
                                options={userName}
                                name="inventoryManager"
                                value={formData.inventoryManager}
                                onChange={handleChange}
                                error={errors.inventoryManager}
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

                            <p className="parrafo-edit-style">Estado:</p>
                            <Select
                                options={materialState}
                                name="materialState"
                                value={formData.materialState}
                                onChange={handleChange}
                                error={errors.materialState}
                                variant="isEdit"
                            />

                            {/* Botones de acción */}
                            <div className="place-items-start">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(-1)}
                                    type="button"
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
                </form>
            </div>
        </div>
    );
}