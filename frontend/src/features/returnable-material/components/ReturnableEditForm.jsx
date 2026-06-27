import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FilePenLine, Image, FileText } from "lucide-react";

import {
    Input,
    Button,
    Select,
    Textarea,
    Alert,
    IconButton
} from "@/shared";

import ImageModal from "./ReturnableModalImage";
import TechnicalFilesModal from "./ReturnableModalTechnicalFile";

import {
    getBrands,
    getInventoryManagers,
    getMaterialCategories
} from "../services/selectService";

import {
    getReturnables,
    uploadTechnicalFiles,
    deleteTechnicalFile
} from "../services/returnableService";

import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema";

const API_URL = "/api";


async function updateReturnable(id, formData, newImageFile) {
    const token = sessionStorage.getItem("token");
    const data = new FormData();

    data.append("brand", formData.brandName);
    data.append("inventory_manager", formData.inventoryManager);
    data.append("material_name", formData.materialName);
    data.append("material_description", formData.materialDescription);
    data.append("material_barcode_sena", formData.materialBarcodeSena);
    data.append("material_unit_price", formData.materialUnitPrice);
    data.append("material_location", formData.materialLocation || "");
    data.append("material_model", formData.returnableMaterialModel);
    data.append("material_serial", formData.returnableMaterialSerial);
    data.append("material_category", formData.returnableMaterialCategory);

    if (formData.returnableMaterialDimensions) {
        data.append("material_dimensions", formData.returnableMaterialDimensions);
    }

    if (newImageFile) {
        data.append("material_image", newImageFile);
    }

    const response = await fetch(`${API_URL}/returnable-materials/${id}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: data
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
    }

    return response.json();
}


export default function ReturnableEditForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    /* Datos */
    const [formData, setFormData] = useState({
        materialBarcodeSena: "",
        brandName: "",
        returnableMaterialModel: "",
        materialName: "",
        inventoryManager: "",
        materialDescription: "",
        materialUnitPrice: "",
        materialLocation: "",
        returnableMaterialSerial: "",
        returnableMaterialCategory: "",
        returnableMaterialDimensions: ""
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* Imagen */
    const [currentImage, setCurrentImage] = useState(null);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [showFileInput, setShowFileInput] = useState(false);

   
    const [existingFiles, setExistingFiles] = useState([]);
    const [newTechFiles, setNewTechFiles] = useState([]);
    const [removedFileIds, setRemovedFileIds] = useState([]);

    /* Los selects */
    const [brands, setBrands] = useState([]);
    const [managers, setManagers] = useState([]);
    const categories = getMaterialCategories();

    /* Para los modeles de imagen y ficha */
    const [showImageModal, setShowImageModal] = useState(false);
    const [showFilesModal, setShowFilesModal] = useState(false);

    const materialStateOptions = [
        { value: "Disponible", label: "Disponible" },
        { value: "Agotado", label: "Agotado" },
        { value: "En revisión", label: "En revisión" },
        { value: "Dado de baja", label: "Dado de baja" }
    ];

    /* Cargar materiales devolutivos */
    useEffect(() => {
        async function load() {
            try {
                const [all, brands, managers] = await Promise.all([
                    getReturnables(),
                    getBrands(),
                    getInventoryManagers()
                ]);

                const material = all.find(m => String(m.id) === String(id));
                if (!material) return;

                setFormData({
                    materialBarcodeSena: material.material_barcode_sena ?? "",
                    brandName: String(material.brand),
                    returnableMaterialModel: material.material_model ?? "",
                    materialName: material.material_name ?? "",
                    inventoryManager: String(material.inventory_manager),
                    materialDescription: material.material_description ?? "",
                    materialUnitPrice: material.material_unit_price ?? "",
                    materialLocation: material.material_location ?? "",
                    returnableMaterialSerial: material.material_serial ?? "",
                    returnableMaterialCategory: material.material_category ?? "",
                    returnableMaterialDimensions: material.material_dimensions ?? ""
                });

                setCurrentImage(material.material_image ?? null);
                setExistingFiles(material.technical_files ?? []);

                setBrands(brands);
                setManagers(managers);
            } catch {
                Alert.error("Error", "No se pudo cargar el material");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    /* Handle */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* Submit */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = returnableMaterialSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach(issue => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            setSaving(true);

            await updateReturnable(
                id,
                result.data,
                newImageFiles.length > 0 ? newImageFiles[0] : null
            );

            for (const fileId of removedFileIds) {
                await deleteTechnicalFile(id, fileId);
            }

            if (newTechFiles.length > 0) {
                await uploadTechnicalFiles(id, newTechFiles);
            }

            Alert.success("OK", "Material actualizado");
            navigate("/dashboard/returnable-material-list");

        } catch (err) {
            Alert.error("Error", "No se pudo guardar");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-6">Cargando...</p>;
    }

    return (
        <div className="w-full flex flex-col items-center">

            <div className="w-full bg-gradient-container-green p-3 rounded-3xl">

                {/* Header + Botones */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">

                    {/* Header */}
                    <div className="max-w-max mb-1">
                        <h1 className="flex gap-2 text-gradient-title text-h3">
                            <FilePenLine className="text-brand" />
                            Editar material devolutivo
                        </h1>{/*linea degradada del titulo*/}
                        <div className="h-0.5 bg-gradiant-title-line"></div>
                    </div>

                    <div className="flex gap-2">
                        {/* Agregar imagen */}
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowImageModal(true)}
                        >
                            <Image size={18} />
                            Imagen
                        </Button>

                        {/* Agregar ficha tecnica */}
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowFilesModal(true)}
                        >
                            <FileText size={18} />
                            Fichas
                        </Button>

                    </div>
                </div>

                {/* Formulario */}
                <form
                    onSubmit={handleSubmit}
                    className="grid lg:grid-cols-3 gap-4"
                >
                    {/* IZQUIERDA */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-2">

                        <div>
                            <p className="parrafo-edit-style">
                                Placa SENA:
                            </p>

                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Categoría:
                            </p>

                            <Select
                                options={categories}
                                name="returnableMaterialCategory"
                                value={formData.returnableMaterialCategory}
                                onChange={handleChange}
                                error={errors.returnableMaterialCategory}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Serial:
                            </p>

                            <Input
                                name="returnableMaterialSerial"
                                value={formData.returnableMaterialSerial}
                                onChange={handleChange}
                                error={errors.returnableMaterialSerial}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Estado material:
                            </p>

                            <Select
                                name="materialState"
                                options={materialStateOptions}
                                value={formData.materialState}
                                onChange={handleChange}
                                error={errors.materialState}
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

                    </div>

                    {/* CENTRO */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-3">

                        <div>
                            <p className="parrafo-edit-style">
                                Modelo:
                            </p>

                            <Input
                                name="returnableMaterialModel"
                                value={formData.returnableMaterialModel}
                                onChange={handleChange}
                                error={errors.returnableMaterialModel}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Valor unitario:
                            </p>

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
                            <p className="parrafo-edit-style">
                                Precio total:
                            </p>

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
                            <p className="parrafo-edit-style">
                                Descripción:
                            </p>

                            <Textarea
                                name="materialDescription"
                                value={formData.materialDescription}
                                onChange={handleChange}
                                error={errors.materialDescription}
                                variant="isEdit"
                            />
                        </div>

                    </div>

                    {/* Derecha */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-3">

                        <div>
                            <p className="parrafo-edit-style">
                                Marca:
                            </p>

                            <Select
                                options={brands}
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                error={errors.brandName}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Cantidad:
                            </p>

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
                            <p className="parrafo-edit-style">
                                Dimensiones:
                            </p>

                            <Input
                                name="returnableMaterialDimensions"
                                value={formData.returnableMaterialDimensions}
                                onChange={handleChange}
                                error={errors.returnableMaterialDimensions}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Cuentadante:
                            </p>

                            <Select
                                options={managers}
                                name="inventoryManager"
                                value={formData.inventoryManager}
                                onChange={handleChange}
                                error={errors.inventoryManager}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">
                                Ubicación:
                            </p>

                            <Input
                                name="materialLocation"
                                value={formData.materialLocation}
                                onChange={handleChange}
                                error={errors.materialLocation}
                                variant="isEdit"
                            />
                        </div>

                    </div>


                    {/* FOOTER */}
                    <div className="lg:col-span-3 flex justify-between lg:justify-end">
                        <div className="block lg:hidden">
                            <Button type="button" variant="secondary" size="sm" onClick={() => navigate(-1)}>
                                Cancelar
                            </Button>

                        </div>
                        <IconButton type="submit" variant="primary" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar"}
                        </IconButton>
                    </div>

                </form>

            </div>

            {/* MODALS */}
            <ImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                currentImage={currentImage}
                newImageFiles={newImageFiles}
                setNewImageFiles={setNewImageFiles}
                showFileInput={showFileInput}
                setShowFileInput={setShowFileInput}
                materialName={formData.materialName}
            />

            <TechnicalFilesModal
                isOpen={showFilesModal}
                onClose={() => setShowFilesModal(false)}
                existingFiles={existingFiles}
                setExistingFiles={setExistingFiles}
                newTechFiles={newTechFiles}
                setNewTechFiles={setNewTechFiles}
                setRemovedFileIds={setRemovedFileIds}
            />

        </div>
    );
}