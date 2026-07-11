import { useState, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { FilePenLine, Image, FileText } from "lucide-react";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";

import {
    Input,
    Button,
    Select,
    Textarea,
    Alert,
    IconButton,
    StatusSwitch
} from "@/shared";

import ImageModal from "./ReturnableModalImage";
import TechnicalFilesModal from "./ReturnableModalTechnicalFile";

import {
    getBrands,
    getInventoryManagers,
    getMaterialCategories,
    getMaterialStates
} from "../services/selectService";

import {
    getReturnables,
    uploadTechnicalFiles,
    deleteTechnicalFile
} from "../services/returnableService";

import { returnableEditSchema } from "../schemas/returnableEditSchema";

const API_URL = "/api";


async function updateReturnable(id, formData, isActive, newImageFile) {
    const token = sessionStorage.getItem("token");
    const data = new FormData();

    data.append("brand", formData.brandName);
    data.append("inventory_manager", formData.inventoryManager);
    data.append("material_name", formData.materialName);
    data.append("material_description", formData.materialDescription);
    data.append("material_barcode_sena", formData.materialBarcodeSena || "");
    data.append("material_unit_price", formData.materialUnitPrice);
    data.append("material_location", formData.materialLocation || "");
    data.append("material_model", formData.returnableMaterialModel || "");
    data.append("material_serial", formData.returnableMaterialSerial || "");
    data.append("material_category", formData.returnableMaterialCategory);
    data.append("material_quantity", formData.materialQuantity || "1");
    data.append("is_active", isActive);

    if (!isActive && formData.materialState) {
        data.append("material_state", formData.materialState);
    }

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
        materialQuantity: "1",
        returnableMaterialSerial: "",
        returnableMaterialCategory: "",
        returnableMaterialDimensions: "",
        materialState: "",
    });

    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* Imagen */
    const [currentImage, setCurrentImage] = useState(null);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [showFileInput, setShowFileInput] = useState(false);

    /* Fichas técnicas */
    const [existingFiles, setExistingFiles] = useState([]);
    const [newTechFiles, setNewTechFiles] = useState([]);
    const [removedFileIds, setRemovedFileIds] = useState([]);

    /* Selects */
    const [brands, setBrands] = useState([]);
    const [managers, setManagers] = useState([]);
    const categories = getMaterialCategories();
    const materialStateOptions = getMaterialStates();

    /* Modales */
    const [showImageModal, setShowImageModal] = useState(false);
    const [showFilesModal, setShowFilesModal] = useState(false);
    // Vigilate de los cambios
    const [isDirty, setIsDirty] = useState(false);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            Alert.warning(
                "¿Salir sin guardar?",
                "Los cambios no guardados se perderán"
            ).then((result) => {
                if (result.isConfirmed) {
                    setIsDirty(false);
                    blocker.proceed();
                } else {
                    blocker.reset();
                }
            });
        }
    }, [blocker]);

    /* Cargar material */
    useEffect(() => {
        async function load() {
            try {
                const [all, brandsData, managersData] = await Promise.all([
                    getReturnables(),
                    getBrands(),
                    getInventoryManagers()
                ]);

                const material = all.find(m => String(m.id) === String(id));
                if (!material) {
                    Alert.error("Error", "Material no encontrado");
                    return;
                }

                setIsActive(material.is_active ?? true);
                setFormData({
                    materialBarcodeSena: material.material_barcode_sena ?? "",
                    brandName: String(material.brand),
                    returnableMaterialModel: material.material_model ?? "",
                    materialName: material.material_name ?? "",
                    inventoryManager: String(material.inventory_manager),
                    materialDescription: material.material_description ?? "",
                    materialUnitPrice: material.material_unit_price ?? "",
                    materialLocation: material.material_location ?? "",
                    materialQuantity: String(material.material_quantity ?? 1),
                    returnableMaterialSerial: material.material_serial ?? "",
                    returnableMaterialCategory: material.material_category ?? "",
                    returnableMaterialDimensions: material.material_dimensions ?? "",
                    materialState: material.material_state ?? "",
                });

                setCurrentImage(material.material_image ?? null);
                setExistingFiles(material.technical_files ?? []);
                setBrands(brandsData);
                setManagers(managersData);
            } catch {
                Alert.error("Error", "No se pudo cargar el material");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
        setIsDirty(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = returnableEditSchema.safeParse({ ...formData, isActive });
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            setSaving(true);
            Alert.loading("Guardando cambios...");

            await updateReturnable(
                id,
                formData,
                isActive,
                newImageFiles.length > 0 ? newImageFiles[0] : null
            );

            for (const fileId of removedFileIds) {
                await deleteTechnicalFile(id, fileId);
            }

            if (newTechFiles.length > 0) {
                await uploadTechnicalFiles(id, newTechFiles);
            }
            setIsDirty(false);
            Alert.close();
            await Alert.success("Material actualizado", "Los cambios se guardaron correctamente.");
            navigate(-1);

        } catch (err) {
            Alert.close();
            try {
                const errObj = JSON.parse(err.message);
                const first = Object.values(errObj)[0];
                Alert.error("Error", Array.isArray(first) ? first[0] : String(first));
            } catch {
                Alert.error("Error", "No se pudo guardar el material");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando material...</p>
        </div>
    );

    return (
        <div className="w-full flex flex-col items-center">

            <div className="w-full bg-gradient-container-green p-3 rounded-3xl">

                {/* Header + Botones */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                    <div className="max-w-max mb-1">
                        <h1 className="flex gap-2 text-gradient-title text-h3">
                            <FilePenLine className="text-brand" />
                            Editar material devolutivo
                        </h1>
                        <div className="h-0.5 bg-gradiant-title-line"></div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowImageModal(true)}>
                            <Image size={18} />
                            Imagen
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowFilesModal(true)}>
                            <FileText size={18} />
                            Fichas
                        </Button>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-4">

                    {/* IZQUIERDA */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-2">

                        <div>
                            <p className="parrafo-edit-style">Placa SENA:</p>
                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">Categoría:</p>
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
                            <p className="parrafo-edit-style">Serial:</p>
                            <Input
                                name="returnableMaterialSerial"
                                value={formData.returnableMaterialSerial}
                                onChange={handleChange}
                                error={errors.returnableMaterialSerial}
                                variant="isEdit"
                            />
                        </div>

                        {/* Estado — Switch + motivo condicional */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="parrafo-edit-style">Estado:</span>
                                <StatusSwitch
                                    checked={isActive}
                                    onChange={() => {
                                        setIsActive(prev => !prev);
                                        if (isActive) setFormData(prev => ({ ...prev, materialState: "" }));
                                        setIsDirty(true);
                                    }}
                                    className="inline-flex"
                                />
                            </div>
                            {!isActive && (
                                <div>
                                    <p className="parrafo-edit-style">Motivo inactividad:</p>
                                    <Select
                                        name="materialState"
                                        options={materialStateOptions}
                                        value={formData.materialState}
                                        onChange={handleChange}
                                        error={errors.materialState}
                                        variant="isEdit"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="parrafo-edit-style">Nombre del elemento:</p>
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
                            <p className="parrafo-edit-style">Cantidad:</p>
                            {formData.returnableMaterialCategory === "herramienta" && !formData.materialBarcodeSena?.trim() ? (
                                <Input
                                    type="number"
                                    name="materialQuantity"
                                    value={formData.materialQuantity}
                                    onChange={handleChange}
                                    error={errors.materialQuantity}
                                    variant="isEdit"
                                />
                            ) : (
                                <p className="text-text-primary font-semibold text-sm py-1">1</p>
                            )}
                        </div>
                        <div>
                            <p className="parrafo-edit-style">Valor unitario:</p>
                            <Input
                                type="number"
                                name="materialUnitPrice"
                                value={formData.materialUnitPrice}
                                onChange={handleChange}
                                error={errors.materialUnitPrice}
                                variant="isEdit"
                            />
                        </div>
                        {Number(formData.materialQuantity) > 1 && (
                            <div>
                                <p className="parrafo-edit-style">Valor total:</p>
                                <p className="text-text-primary font-semibold text-sm py-1">
                                    {`$${(Number(formData.materialQuantity) * Number(formData.materialUnitPrice)).toLocaleString("es-CO")}`}
                                </p>
                            </div>
                        )}

                    </div>

                    {/* DERECHA */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-3">

                        <div>
                            <p className="parrafo-edit-style">Marca:</p>
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
                            <p className="parrafo-edit-style">Cuentadante:</p>
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
                            <p className="parrafo-edit-style">Descripción:</p>
                            <Textarea
                                name="materialDescription"
                                value={formData.materialDescription}
                                onChange={handleChange}
                                error={errors.materialDescription}
                                variant="isEdit"
                            />
                        </div>

                        {/* Dimensiones solo si es muebles_enseres */}
                        {formData.returnableMaterialCategory === "muebles_enseres" && (
                            <div>
                                <p className="parrafo-edit-style">Dimensiones:</p>
                                <Input
                                    name="returnableMaterialDimensions"
                                    value={formData.returnableMaterialDimensions}
                                    onChange={handleChange}
                                    error={errors.returnableMaterialDimensions}
                                    variant="isEdit"
                                />
                            </div>
                        )}

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

            {/* MODALES */}
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
