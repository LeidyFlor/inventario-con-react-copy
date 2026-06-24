import { Input, Button, IconButton, Select, StatusSwitch, FileInput, Alert } from "@/shared";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { FilePenLine } from "lucide-react";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import { getMaterial, updateMaterial } from "../services/materialService";
import { getBrands, getInventoryManagers, getMaterialStates } from "../services/selectService";
import { consumableEditSchema } from "../schemas/consumableEditSchema";

export default function ConsumableEditForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [material, setMaterial]= useState(null);
    const [loading, setLoading]= useState(true);
    const [isDirty, setIsDirty] = useState(false)
    const [brands, setBrands]= useState([]);
    const [managers, setManagers]= useState([]);
    const materialStateOptions= getMaterialStates();

    const [formData, setFormData] = useState({
        brand: "",
        inventoryManager: "",
        materialBarcodeSena: "",
        materialName: "",
        materialDescription: "",
        materialQuantity: "",
        materialUnitPrice: "",
        materialLocation: "",
        materialState: "",
    });
    // bloquea la naveacion para preguntar antes de poder darle en cancelar o ir atras
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    )
    const [isActive, setIsActive]= useState(true);
    const [imagen, setImagen]= useState(null);
    const [showFileInput, setShowFileInput]= useState(false);
    const [materialImage, setMaterialImage]= useState([]);
    const [errors, setErrors]= useState({});
    const [saving, setSaving]= useState(false);

    useEffect(() => {
        if (blocker.state === "blocked") {
            Alert.warning(
                "¿Salir sin guardar?",
                "Los cambios no guardados se perderán"
            ).then((result) => {
                if (result.isConfirmed) {
                    setIsDirty(false)
                    blocker.proceed()
                } else {
                    blocker.reset()
                }
            })
        }
    }, [blocker])
    // Cargar material y selects en paralelo
    useEffect(() => {
        Promise.all([getMaterial(id), getBrands(), getInventoryManagers()])
            .then(([mat, brandsData, managersData]) => {
                setMaterial(mat);
                setBrands(brandsData);
                setManagers(managersData);
                setIsActive(mat.is_active ?? true);
                setImagen(mat.material_image ?? null);
                setFormData({
                    brand: String(mat.brand ?? ""),
                    inventoryManager: String(mat.inventory_manager ?? ""),
                    materialBarcodeSena: mat.material_barcode_sena ?? "",
                    materialName: mat.material_name ?? "",
                    materialDescription: mat.material_description ?? "",
                    materialQuantity: mat.material_quantity ?? "",
                    materialUnitPrice: mat.material_unit_price ?? "",
                    materialLocation: mat.material_location ?? "",
                    materialState: mat.material_state ?? "",
                });
            })
            .catch(() => Alert.error("Error", "No se pudo cargar el material"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
        setIsDirty(true) 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = consumableEditSchema.safeParse({ ...formData, isActive });
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (field) fieldErrors[field] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }
        setSaving(true);
        try {
            await updateMaterial(id, formData, isActive, materialImage);
            setIsDirty(false);
            await Alert.success("Material actualizado", "Los cambios se guardaron correctamente.");
            navigate(-1);
        } catch (err) {
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

    if (!material) return <p>Material no encontrado</p>;

    // Precio total calculado (read-only)
    const totalPrice = (Number(formData.materialQuantity) || 0) * (Number(formData.materialUnitPrice) || 0);

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
                    {/* Columna izquierda — imagen, nombre, descripción, estado */}
                    <div className="flex flex-col gap-4 place-items-center">
                        <div className="flex flex-col gap-4 place-items-center text-center">
                            <h2 className="w-80">Puede subir 1 archivo, archivos permitidos: PDF, PNG, JPG. Máximo 10MB</h2>

                            {imagen ? (
                                <img src={imagen} alt={formData.materialName} className="w-48 h-48 object-cover rounded-lg" />
                            ) : (
                                <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                    <span className="text-2xl font-bold">
                                        {formData.materialName?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {!showFileInput ? (
                                <Button variant="primary" size="sm" type="button" onClick={() => setShowFileInput(true)}>
                                    Cambiar imagen
                                </Button>
                            ) : (
                                <FileInput
                                    value={materialImage}
                                    onChange={(files) => {
                                        setMaterialImage(files);
                                        if (files.length > 0) {
                                            setImagen(URL.createObjectURL(files[0]));
                                            setShowFileInput(false);
                                        }
                                    }}
                                    multiple={false}
                                />
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
                            variant="isEdit"
                        />
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-medium">Estado</span>
                            <StatusSwitch
                                checked={isActive}
                                onChange={() => setIsActive(prev => !prev)}
                                className={`inline-flex`}
                            />
                        </div>
                    </div>

                    {/* Columna derecha — campos del formulario */}
                    <div className="grid grid-cols-dense items-center gap-10 bg-background border-2 border-border-edit-informaion p-8 rounded-xl">
                        <div className="md:grid md:grid-cols-[130px_1fr] grid auto-cols items-center gap-4">

                            <p className="parrafo-edit-style">Placa Sena:</p>
                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Marca:</p>
                            <Select
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                options={brands.map(b => ({ value: String(b.value), label: b.label }))}
                                error={errors.brand}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Cuentadante:</p>
                            <Select
                                name="inventoryManager"
                                value={formData.inventoryManager}
                                onChange={handleChange}
                                options={managers.map(m => ({ value: String(m.value), label: m.label }))}
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
                            <p className="text-text-primary font-semibold">
                                ${totalPrice.toLocaleString("es-CO")}
                            </p>

                            <p className="parrafo-edit-style">Ubicación:</p>
                            <Input
                                name="materialLocation"
                                value={formData.materialLocation}
                                onChange={handleChange}
                                error={errors.materialLocation}
                                variant="isEdit"
                            />

                            {!isActive && (
                                <>
                                    <p className="parrafo-edit-style">Motivo inactividad:</p>
                                    <Select
                                        name="materialState"
                                        options={materialStateOptions}
                                        value={formData.materialState}
                                        onChange={handleChange}
                                        error={errors.materialState}
                                        variant="isEdit"
                                    />
                                </>
                            )}

                            <div className="place-items-start">
                                <Button variant="secondary" size="sm" 
                                    onClick={() => navigate(-1)} 
                                    type="button">
                                    Cancelar
                                </Button>
                            </div>
                            <div className="mt-1 flex items-end justify-end">
                                <IconButton variant="primary" size="md" type="submit" disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar"}
                                </IconButton>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
