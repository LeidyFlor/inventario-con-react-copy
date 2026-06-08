import { Input, Button, IconButton, Select, StatusSwitch } from "@/shared";
import React, { useState } from "react";
import { consumableMaterialShema } from "../schemas/consumableMaterialShema.js";
import { useParams, useNavigate } from "react-router-dom";
import { materials } from "../data/materials.js";
import { FilePenLine } from "lucide-react";

export default function ConsumableEditForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const material = materials.find((m) => m.id === Number(id));

    const [formData, setFormData] = useState({
        materialBarcodeSena: material?.materialBarcodeSena ?? "",
        brandName: material?.brandName ?? "",
        returnableMaterialModel: material?.returnableMaterialModel ?? "",
        materialName: material?.materialName ?? "",
        inventoryManger: material?.inventoryManger ?? "",
        materialDescription: material?.materialDescription ?? "",
        materialState: material?.materialState ?? "",
        materialQuantity: material?.materialQuantity ?? "",
        materialUnitPrice: material?.materialUnitPrice ?? "",
        materialTotalPrice: material?.materialTotalPrice ?? "",
        materialLocation: material?.materialLocation ?? "",
        is_active: material?.is_active ?? true,
    });

    const [isActive, setIsActive] = useState(material?.is_active ?? true);
    const [errors, setErrors] = useState({});

    const materialStateOptions = [
        { value: "Disponible", label: "Disponible" },
        { value: "Agotado", label: "Agotado" },
        { value: "En revisión", label: "En revisión" },
        { value: "Dado de baja", label: "Dado de baja" },
    ];

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

        const result = consumableMaterialShema.safeParse(parsedData);

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
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full mt-2">
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <FilePenLine className="text-brand" />
                        Editar material de consumo
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
                        <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                            <span className="text-2xl font-bold">
                                {material.materialName?.charAt(0).toUpperCase()}
                            </span>
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
                            variant="isEdit"
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
                        <div className="md:grid md:grid-cols-[220px_1fr] grid auto-cols items-center gap-4">

                            <p className="parrafo-edit-style">Placa Sena:</p>
                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                variant="isEdit"
                            />


                            <p className="parrafo-edit-style">Marca:</p>
                            <Input
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

                            <p className="parrafo-edit-style">Cuentadante:</p>
                            <Input
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

                            <p className="parrafo-edit-style">Precio unitario:</p>
                            <Input
                                type="number"
                                name="materialUnitPrice"
                                value={formData.materialUnitPrice}
                                onChange={handleChange}
                                error={errors.materialUnitPrice}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Precio total:</p>
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
                                name="materialState"
                                options={materialStateOptions}
                                value={formData.materialState}
                                onChange={handleChange}
                                error={errors.materialState}
                                variant="isEdit"
                            />

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