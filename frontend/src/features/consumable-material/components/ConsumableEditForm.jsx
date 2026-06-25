import {
    Input,
    Button,
    IconButton,
    Select,
    StatusSwitch,
    FileInput,
    Textarea,
} from "@/shared";
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
        inventoryManager: material?.inventoryManager ?? "",
        materialDescription: material?.materialDescription ?? "",
        materialState: material?.materialState ?? "",
        materialQuantity: material?.materialQuantity ?? "",
        materialUnitPrice: material?.materialUnitPrice ?? "",
        materialTotalPrice: material?.materialTotalPrice ?? "",
        materialLocation: material?.materialLocation ?? "",
        materialImage: material?.materialImage ?? [],
        is_active: material?.is_active ?? true,
    });

    const [isActive, setIsActive] = useState(material?.is_active ?? true);
    const [errors, setErrors] = useState({});
    const [imagen, setImagen] = useState(material?.materialImage ?? null);
    const [showFileInput, setShowFileInput] = useState(false);

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
                fieldErrors[issue.path[0]] = issue.message;
            });

            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        console.log("Material válido:", result.data);
    };

    if (!material) return <p>Material no encontrado</p>;

    return (
        <div className="flex flex-col place-items-center justify-items-center w-full">

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-border-green-container p-6 rounded-4xl w-fit md:w-full">

                <form
                    className="flex flex-col lg:grid lg:grid-cols-[420px_1fr] lg:items-center w-full"
                    onSubmit={handleSubmit}
                    noValidate
                >

                    {/* IZQUIERDA */}
                    <div className="w-full max-w-[320px] mx-auto flex flex-col items-center p-2 gap-2">

                        <div className="mb-2 max-w-max">
                            <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                                <FilePenLine className="text-brand" />
                                Editar material de consumo
                            </h1>
                            <div className="h-0.5 bg-gradiant-title-line"></div>
                        </div>

                        <div className="flex flex-col gap-4 place-items-center">

                            {imagen ? (
                                <img
                                    src={imagen}
                                    alt={material.materialName}
                                    className="w-48 h-48 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                    <span className="text-2xl font-bold">
                                        {material.materialName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            <h2 className="w-70 text-text-muted text-small text-center">
                                1 archivo: PDF, PNG, JPG. Máx 10MB.
                            </h2>

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
                                        setFormData(prev => ({
                                            ...prev,
                                            materialImage: files
                                        }));

                                        if (files.length > 0) {
                                            setImagen(URL.createObjectURL(files[0]));
                                            setShowFileInput(false);
                                        }
                                    }}
                                    multiple={false}
                                />
                            )}

                            {errors.materialImage && (
                                <span className="text-red-800 text-sm">
                                    {errors.materialImage}
                                </span>
                            )}
                        </div>

                        <Textarea
                            name="materialDescription"
                            value={formData.materialDescription}
                            onChange={handleChange}
                            error={errors.materialDescription}
                            variant="isEdit"
                        />

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-medium">Estado</span>
                                <StatusSwitch
                                    checked={isActive}
                                    onChange={() => setIsActive(prev => !prev)}
                                    className={`inline-flex`}
                                />
                            </div>
                        </div>

                    </div>

                    {/* DERECHA */}
                    <div className="w-full flex flex-col gap-4 bg-background border-2 border-border-edit-informaion p-4 rounded-xl">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">

                            <div>
                                <p className="parrafo-edit-style">Placa Sena:</p>
                                <Input
                                    name="materialBarcodeSena"
                                    value={formData.materialBarcodeSena}
                                    onChange={handleChange}
                                    error={errors.materialBarcodeSena}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Marca:</p>
                                <Input
                                    name="brandName"
                                    value={formData.brandName}
                                    onChange={handleChange}
                                    error={errors.brandName}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">
                                    Nombre del elemento:
                                </p>

                                <Input
                                    name="materialName"
                                    value={formData.materialName}
                                    onChange={handleChange}
                                    error={errors.materialName}
                                    variant="isEdit"
                                />
                            </div>


                            <div>
                                <p className="parrafo-edit-style">Modelo:</p>
                                <Input
                                    name="returnableMaterialModel"
                                    value={formData.returnableMaterialModel}
                                    onChange={handleChange}
                                    error={errors.returnableMaterialModel}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Cuentadante:</p>
                                <Input
                                    name="inventoryManager"
                                    value={formData.inventoryManager}
                                    onChange={handleChange}
                                    error={errors.inventoryManager}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Cantidad:</p>
                                <Input
                                    type="number"
                                    name="materialQuantity"
                                    value={formData.materialQuantity}
                                    onChange={handleChange}
                                    error={errors.materialQuantity}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Precio unitario:</p>
                                <Input
                                    type="number"
                                    name="materialUnitPrice"
                                    value={formData.materialUnitPrice}
                                    onChange={handleChange}
                                    error={errors.materialUnitPrice}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Precio total:</p>
                                <Input
                                    type="number"
                                    name="materialTotalPrice"
                                    value={formData.materialTotalPrice}
                                    onChange={handleChange}
                                    error={errors.materialTotalPrice}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Ubicación:</p>
                                <Input
                                    name="materialLocation"
                                    value={formData.materialLocation}
                                    onChange={handleChange}
                                    error={errors.materialLocation}
                                    variant="isEdit"
                                />
                            </div>

                            <div>
                                <p className="parrafo-edit-style">Estado material:</p>

                                <Select
                                    name="materialState"
                                    options={materialStateOptions}
                                    value={formData.materialState}
                                    onChange={handleChange}
                                    error={errors.materialState}
                                    variant="isEdit"
                                />
                            </div>

                            {/* BOTONES */}
                            <div className="col-span-1 md:col-span-2 flex justify-between items-center">

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancelar
                                </Button>

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