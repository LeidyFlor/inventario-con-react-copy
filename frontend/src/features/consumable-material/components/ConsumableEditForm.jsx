import { Input, Button, Select, MultiSelect, StatusSwitch, FileInput, Alert, Textarea, IconButton, TechnicalFilesModal } from "@/shared";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { FilePenLine, FileText, FileStack } from "lucide-react";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import {
    getMaterial,
    updateMaterial,
    uploadTechnicalFiles,
    deleteTechnicalFile,
} from "../services/materialService";
import { getBrands, getInventoryManagers, getMaterialStates, getInventoryNames, getCategories, conOpcionActual, conCuentadantesActuales, cuentadantesSinMarca } from "../services/selectService";
import { consumableEditSchema } from "../schemas/consumableEditSchema";
import { QuotationPickerModal } from "@/features/quotations";

export default function ConsumableEditForm() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [brands, setBrands] = useState([]);
    const [managers, setManagers] = useState([]);
    const [inventoryNames, setInventoryNames] = useState([]);
    const [categories, setCategories] = useState([]);
    const materialStateOptions = getMaterialStates();
    // Cuentadantes asignados que ya perdieron la marca. Vacío = todo en orden.
    const sinMarca = cuentadantesSinMarca(material?.inventory_managers_display ?? []);

    /* Fichas técnicas — mismo manejo que en el editar de devolutivo:
       lo existente se marca para borrar y lo nuevo se sube al guardar */
    const [existingFiles, setExistingFiles]   = useState([]);
    const [newTechFiles, setNewTechFiles]     = useState([]);
    const [removedFileIds, setRemovedFileIds] = useState([]);
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [showQuotations, setShowQuotations] = useState(false);

    const [formData, setFormData] = useState({
        brand: "",
        inventoryName: "",
        category: "",
        materialModel: "",
        inventoryManagers: [],
        materialBarcodeSena: "",
        materialName: "",
        materialDescription: "",
        materialQuantity: "",
        materialUnitPrice: "",
        materialLocation: "",
        materialSerial: "",
        materialPurchaseDate: "",
        materialEntryDate: "",
        materialState: "",
        // Ids de las cotizaciones enlazadas, como texto. De 1 a 3.
        quotations: [],
    });

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    const [isActive, setIsActive] = useState(true);
    const [imagen, setImagen] = useState(null);
    const [showFileInput, setShowFileInput] = useState(false);
    const [materialImage, setMaterialImage] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        Promise.all([
            getMaterial(id),
            getBrands(),
            getInventoryManagers(),
            getInventoryNames(),
            getCategories(),
        ])
            .then(([mat, brandsData, managersData, inventoryNamesData, categoriesData]) => {
                setMaterial(mat);
                setBrands(brandsData);
                setManagers(managersData);
                setInventoryNames(inventoryNamesData);
                setCategories(categoriesData);
                setIsActive(mat.is_active ?? true);
                setImagen(mat.material_image ?? null);
                setExistingFiles(mat.technical_files ?? []);
                setFormData({
                    brand: String(mat.brand ?? ""),
                    // Vienen como id numérico; el Select compara contra texto
                    inventoryName: String(mat.inventory_name ?? ""),
                    category: String(mat.category ?? ""),
                    materialModel: mat.material_model ?? "",
                    inventoryManagers: (mat.inventory_managers ?? []).map(String),
                    materialBarcodeSena: mat.material_barcode_sena ?? "",
                    materialName: mat.material_name ?? "",
                    materialDescription: mat.material_description ?? "",
                    materialQuantity: mat.material_quantity ?? "",
                    materialUnitPrice: mat.material_unit_price ?? "",
                    materialLocation: mat.material_location ?? "",
                    materialSerial: mat.material_serial ?? "",
                    // Vienen como "YYYY-MM-DD", que es justo lo que espera el input date
                    materialPurchaseDate: mat.material_purchase_date ?? "",
                    materialEntryDate: mat.material_entry_date ?? "",
                    materialState: mat.material_state ?? "",
                    // El backend devuelve las cotizaciones completas; aquí
                    // solo interesan los ids para el modal de selección
                    quotations: (mat.quotations ?? []).map(q => String(q.id)),
                });
            })
            .catch(() => Alert.error("Error", "No se pudo cargar el material"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
        setIsDirty(true);
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
            Alert.loading("Guardando cambios...");
            await updateMaterial(id, formData, isActive, materialImage);

            // Fichas técnicas: primero se borran las marcadas y luego se suben
            // las nuevas. El backend rechaza dejar el material sin ninguna.
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
            // El servicio ya entrega el mensaje listo: antes aquí se
            // parseaba un JSON metido dentro del texto del error
            Alert.error("Error", err.message)
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

    const totalPrice = (Number(formData.materialQuantity) || 0) * (Number(formData.materialUnitPrice) || 0);

    return (
        <div className="w-full flex flex-col items-center">

            <div className="w-full bg-gradient-container-green p-3 rounded-3xl">

                {/* Header */}
                <div className="flex justify-between items-start mb-1">
                    <div className="max-w-max">
                        <h1 className="flex gap-2 text-gradient-title text-h3">
                            <FilePenLine className="text-brand" />
                            Editar material de consumo
                        </h1>
                        <div className="h-0.5 bg-gradiant-title-line"></div>
                    </div>

                    {/* Mismo botón que en el editar de devolutivo */}
                    <div className="flex gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowFilesModal(true)}>
                            <FileText size={18} />
                            Fichas
                        </Button>
                        <div className="flex flex-col">
                            <Button type="button" size="sm" variant="ghost" onClick={() => setShowQuotations(true)}>
                                <FileStack size={18} />
                                Cotizaciones ({formData.quotations.length})
                            </Button>
                            {/* El botón por sí solo no dice que sean obligatorias.
                                Sin este aviso, quien nunca abre el modal no
                                entiende por qué no puede guardar. */}
                            {errors.quotations && (
                                <span className="text-red-800 text-sm">{errors.quotations}</span>
                            )}
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="grid lg:grid-cols-3 gap-x-3 gap-y-0.5"
                >

                    {/* IZQUIERDA — imagen + estado */}
                    <div className="p-2 flex flex-col gap-3 items-center justify-center">

                        {imagen ? (
                            <img
                                src={imagen}
                                alt={formData.materialName}
                                className="w-48 h-48 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                <span className="text-h3 font-bold text-text-primary">
                                    {formData.materialName?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                        <p className="text-text-muted text-small text-center">
                            Solo se admite 1 archivo (PNG, JPG). Máx 10MB.
                        </p>

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
                        <div>
                            <Input
                                name="materialName"
                                value={formData.materialName}
                                onChange={handleChange}
                                error={errors.materialName}
                                variant="nameEdit"
                                label="Nombre del elemento"
                            />
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                            <p className="parrafo-edit-style">Estado:</p>
                            <StatusSwitch
                                className="inline-flex"
                                checked={isActive}
                                onChange={() => {setIsActive(prev => !prev);
                                    setIsDirty(true);}
                                }
                            />
                        </div>
                        {!isActive && (
                            <div>
                                
                                <Select
                                    name="materialState"
                                    options={materialStateOptions}
                                    value={formData.materialState}
                                    onChange={handleChange}
                                    error={errors.materialState}
                                    label="Motivo inactividad"
                                    
                                />
                            </div>
                        )}

                    </div>

                    {/* CENTRO — identificación + responsable */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-1 min-w-0">

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
                            <p className="parrafo-edit-style">Marca:</p>
                            <Select
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                options={conOpcionActual(brands, formData.brand, material?.brand_name)}
                                error={errors.brand}
                                variant="isEdit"
                            />
                        </div>

                        {/* Inventario y categoría: obligatorios, se administran
                            desde Configuración. Los ids se comparan como texto */}
                        <div>
                            <p className="parrafo-edit-style">Nombre de inventario:</p>
                            <Select
                                name="inventoryName"
                                value={formData.inventoryName}
                                onChange={handleChange}
                                options={conOpcionActual(inventoryNames, formData.inventoryName, material?.inventory_name_display)}
                                error={errors.inventoryName}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">Categoría:</p>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                options={conOpcionActual(categories, formData.category, material?.category_display)}
                                error={errors.category}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">Modelo:</p>
                            <Input
                                name="materialModel"
                                value={formData.materialModel}
                                onChange={handleChange}
                                error={errors.materialModel}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">Cuentadante:</p>
                            {/* Varios cuentadantes, mínimo uno. MultiSelect no
                                usa event.target: entrega (name, valor) directo */}
                            <MultiSelect
                                widthClass="w-full lg:w-60"
                                name="inventoryManagers"
                                value={formData.inventoryManagers}
                                onChange={(name, newValue) =>
                                    setFormData(prev => ({ ...prev, [name]: newValue }))
                                }
                                options={managers.map(m => ({ value: String(m.value), label: m.label }))}
                                error={errors.inventoryManagers}
                                variant="isEdit"
                            />
                            {/* Advertencia, no bloqueo: el material se puede
                                guardar tal cual y es la persona quien decide si
                                le cambia el cuentadante. */}
                            {sinMarca.length > 0 && (
                                <p className="text-amber-700 text-sm mt-1">
                                    {sinMarca.length === 1
                                        ? `${sinMarca[0]} ya no es cuentadante.`
                                        : `Estos usuarios ya no son cuentadantes: ${sinMarca.join(", ")}.`}
                                    {" "}Puedes dejarlo así o asignar otro.
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="parrafo-edit-style">S/N:</p>
                            <Input
                                name="materialSerial"
                                value={formData.materialSerial}
                                onChange={handleChange}
                                error={errors.materialSerial}
                                variant="isEdit"
                            />
                        </div>

                        
                    </div>

                    {/* DERECHA — cantidades + descripción */}
                    <div className="bg-background p-4 rounded-xl flex flex-col gap-1">
                        {/* Fechas de adquisición — obligatorias */}
                        <div>
                            <p className="parrafo-edit-style">Fecha de compra:</p>
                            <Input
                                type="date"
                                name="materialPurchaseDate"
                                value={formData.materialPurchaseDate}
                                onChange={handleChange}
                                error={errors.materialPurchaseDate}
                                variant="isEdit"
                            />
                        </div>

                        <div>
                            <p className="parrafo-edit-style">Fecha de ingreso:</p>
                            <Input
                                type="date"
                                name="materialEntryDate"
                                value={formData.materialEntryDate}
                                onChange={handleChange}
                                error={errors.materialEntryDate}
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
                            <p className="text-text-primary font-semibold text-medium">
                                ${totalPrice.toLocaleString("es-CO")}
                            </p>
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
                                rows={3}
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

            {/* Modal de fichas técnicas — el mismo que usa devolutivo */}
            <TechnicalFilesModal
                isOpen={showFilesModal}
                onClose={() => setShowFilesModal(false)}
                existingFiles={existingFiles}
                setExistingFiles={setExistingFiles}
                newTechFiles={newTechFiles}
                setNewTechFiles={setNewTechFiles}
                setRemovedFileIds={setRemovedFileIds}
            />

            {/* Cotizaciones — se eligen de las ya cargadas en Configuración.
                El overlay lo pone el propio Modal compartido */}
            {showQuotations && (
                <QuotationPickerModal
                    value={formData.quotations}
                    onConfirm={(ids) => {
                        setFormData((prev) => ({ ...prev, quotations: ids }));
                        setErrors((prev) => ({ ...prev, quotations: undefined }));
                        setIsDirty(true);
                    }}
                    onClose={() => setShowQuotations(false)}
                />
            )}

        </div>
    );
}
