// src/features/returnable-material/components/ReturnableRegisterForm.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Router } from "lucide-react"
import { Input, Button, Select, MultiSelect, FileInput, Textarea, Alert, IconButton } from "@/shared"
import { getBrands, getInventoryManagers, getMaterialTypes, getInventoryNames, getCategories } from "../services/selectService"
import { createReturnable } from "../services/returnableService"
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema"
import { QuotationPickerModal } from "@/features/quotations"

export default function ReturnableRegisterForm() {
    const navigate = useNavigate()

    // ── Estado del formulario 
    const [formData, setFormData] = useState({
        materialBarcodeSena: "",
        brandName: "",
        inventoryName: "",
        category: "",
        returnableMaterialModel:"",
        materialName:"",
        inventoryManagers: [],
        materialDescription:  "",
        materialUnitPrice:"",
        materialLocation:"",
        materialQuantity: "",
        returnableMaterialSerial:"",
        returnableMaterialType:"",
        returnableMaterialDimensions:  "",
        materialPurchaseDate: "",
        materialEntryDate: "",
        materialImage: [],
        materialTechnicalSheet: [],
        // Ids de las cotizaciones elegidas, como texto. De 1 a 3.
        quotations: [],
    })
    const [errors, setErrors]   = useState({})
    const [loading, setLoading] = useState(false)
    const [showQuotations, setShowQuotations] = useState(false)

    //  Opciones de selects 
    const [brands,     setBrands]     = useState([])
    const [managers,   setManagers]   = useState([])
    const [inventoryNames, setInventoryNames] = useState([])
    const [categories, setCategories] = useState([])
    // Los tipos de material son constantes — se inicializan directamente
    const materialTypes = getMaterialTypes()

    useEffect(() => {
        getBrands().then(setBrands)
        getInventoryManagers().then(setManagers)
        getInventoryNames().then(setInventoryNames)
        getCategories().then(setCategories)
    }, [])

    //  Handlers 
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validación Zod
        const result = returnableMaterialSchema.safeParse(formData)
        if (!result.success) {
            const fieldErrors = {}
            result.error.issues.forEach(issue => {
                fieldErrors[issue.path[0]] = issue.message
            })
            setErrors(fieldErrors)
            return
        }
        setErrors({})

        try {
            setLoading(true)
            Alert.loading("Creando material...")
            await createReturnable(result.data)
            Alert.close()
            await Alert.success("Material creado", "El material devolutivo fue registrado correctamente")
            navigate("/dashboard/returnable-material-list")
        } catch (err) {
            // Muestra el error real del backend para facilitar el diagnóstico
            Alert.close()
            Alert.error("Error al crear el material", err.message || "No se pudo crear el material.")
            console.error("Error backend:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col place-items-center justify-items-center relative">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit h-fit">

                {/* Título */}
                <div className="mb-1 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Router className="text-brand" />
                        Crear material devolutivo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form
                    className="grid md:grid-flow-col-dense items-center gap-10"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {/*  Columna de archivos  */}
                    <div className="flex flex-col items-center gap-1 md:gap-6">

                        {/* Imagen principal */}
                        <div className="flex flex-col gap-3 items-center text-center">
                            <h2 className="font-bold text-body">Imagen del elemento</h2>
                            <p className="text-text-muted text-small text-center">
                                Solo se admite 1 archivo (PNG, JPG). Máx 10MB.
                            </p>
                            <FileInput
                                value={formData.materialImage ?? []}
                                onChange={(files) =>
                                    setFormData(prev => ({ ...prev, materialImage: files }))
                                }
                                multiple={false}
                            />
                            {errors.materialImage && (
                                <span className="text-red-800 text-sm">{errors.materialImage}</span>
                            )}
                        </div>

                        {/* Fichas técnicas */}
                        <div className="flex flex-col gap-3 items-center text-center">
                            <h2 className="font-bold text-body">Ficha técnica</h2>
                            <p className="text-text-muted text-small text-center">
                                Se admiten hasta 3 archivos (PNG, JPG, PDF). Máx 10MB.
                            </p>
                            <FileInput
                                value={formData.materialTechnicalSheet ?? []}
                                onChange={(files) =>
                                    setFormData(prev => ({ ...prev, materialTechnicalSheet: files }))
                                }
                                multiple={true}
                            />
                            {errors.materialTechnicalSheet && (
                                <span className="text-red-800 text-sm">{errors.materialTechnicalSheet}</span>
                            )}
                        </div>

                        {/* Cotizaciones — se eligen de las ya cargadas en
                            Configuración, aquí no se suben archivos */}
                        <div className="flex flex-col gap-3 items-center text-center">
                            <h2 className="font-bold text-body">Cotizaciones</h2>
                            <p className="text-text-muted text-small text-center">
                                Elige de 1 a 3 cotizaciones ya cargadas.
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => setShowQuotations(true)}
                            >
                                {formData.quotations.length > 0
                                    ? `${formData.quotations.length} elegida(s)`
                                    : "Elegir cotizaciones"}
                            </Button>
                            {errors.quotations && (
                                <span className="text-red-800 text-sm">{errors.quotations}</span>
                            )}
                        </div>
                    </div>

                    {/*  Columna de campos  */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 min-w-0">

                        {/* Columna izquierda */}
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <Input
                                label="Placa SENA"
                                placeholder="Placa SENA"
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
                                required
                            />
                            <Input
                                label="S/N"
                                placeholder="S/N del elemento"
                                name="returnableMaterialSerial"
                                value={formData.returnableMaterialSerial}
                                onChange={handleChange}
                                error={errors.returnableMaterialSerial}
                            />
                            {/* Fechas de adquisición — obligatorias */}
                            <Input
                                type="date"
                                label="Fecha de compra"
                                name="materialPurchaseDate"
                                value={formData.materialPurchaseDate}
                                onChange={handleChange}
                                error={errors.materialPurchaseDate}
                                required
                            />
                            <Input
                                type="date"
                                label="Fecha de ingreso"
                                name="materialEntryDate"
                                value={formData.materialEntryDate}
                                onChange={handleChange}
                                error={errors.materialEntryDate}
                                required
                            />
                            
                            <Input
                                label="Nombre del elemento"
                                placeholder="Nombre del elemento"
                                name="materialName"
                                value={formData.materialName}
                                onChange={handleChange}
                                error={errors.materialName}
                                required
                            />
                            
                            <Textarea
                                label="Descripción"
                                placeholder="Descripción del elemento"
                                name="materialDescription"
                                value={formData.materialDescription}
                                onChange={handleChange}
                                error={errors.materialDescription}
                                rows={3}
                                required
                            />
                        </div>

                        {/* Columna derecha */}
                        <div className="flex flex-col gap-0.5">
                            {/* Un material puede quedar a cargo de varios
                                cuentadantes, mínimo uno. MultiSelect no usa
                                event.target, entrega (name, valor) directo. */}
                            <MultiSelect
                                widthClass="w-full lg:w-60"
                                label="Cuentadante(s)"
                                options={managers}
                                name="inventoryManagers"
                                value={formData.inventoryManagers}
                                onChange={(name, newValue) =>
                                    setFormData(prev => ({ ...prev, [name]: newValue }))
                                }
                                error={errors.inventoryManagers}
                                required
                            />
                            <Select
                                label="Tipo de material"
                                options={materialTypes}
                                name="returnableMaterialType"
                                value={formData.returnableMaterialType}
                                onChange={handleChange}
                                error={errors.returnableMaterialType}
                                required
                            />
                            {/* Inventario y categoría: obligatorios, se
                                administran desde Configuración */}
                            <Select
                                label="Nombre de inventario"
                                options={inventoryNames}
                                name="inventoryName"
                                value={formData.inventoryName}
                                onChange={handleChange}
                                error={errors.inventoryName}
                                required
                            />
                            <Select
                                label="Categoría"
                                options={categories}
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                error={errors.category}
                                required
                            />
                            {/* Marca opcional, igual que el modelo */}
                            <Select
                                label="Marca"
                                options={brands}
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                error={errors.brandName}
                            />
                            <Input
                                label="Modelo"
                                placeholder="Modelo del elemento"
                                name="returnableMaterialModel"
                                value={formData.returnableMaterialModel}
                                onChange={handleChange}
                                error={errors.returnableMaterialModel}
                            />
                            <Input
                                label="Valor unitario"
                                placeholder="Valor unitario"
                                type="number"
                                name="materialUnitPrice"
                                value={formData.materialUnitPrice}
                                onChange={handleChange}
                                error={errors.materialUnitPrice}
                                required
                            />
                            {/* Cantidad editable solo para herramienta sin placa */}
                            {formData.returnableMaterialType === "herramienta" && !formData.materialBarcodeSena?.trim() && (
                                <Input
                                    label="Cantidad"
                                    placeholder="Cantidad"
                                    type="number"
                                    name="materialQuantity"
                                    value={formData.materialQuantity}
                                    onChange={handleChange}
                                    error={errors.materialQuantity}
                                />
                            )}
                            <Input
                                label="Ubicación"
                                placeholder="Ubicación del elemento"
                                name="materialLocation"
                                value={formData.materialLocation}
                                onChange={handleChange}
                                error={errors.materialLocation}
                            />
                            {/* Dimensiones solo aparece si el tipo es muebles_enseres */}
                            {formData.returnableMaterialType === "muebles_enseres" && (
                                <Input
                                    label="Dimensiones"
                                    placeholder="Ej: 120x75x20cm"
                                    name="returnableMaterialDimensions"
                                    value={formData.returnableMaterialDimensions}
                                    onChange={handleChange}
                                    error={errors.returnableMaterialDimensions}
                                />
                            )}

                            {/* Boton */}

                                <div className="mt-1 flex items-end justify-end">
                                    <IconButton
                                        variant="primary"
                                        size="md"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? "Guardando..." : "Crear"}
                                    </IconButton>
                                </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* El overlay lo pone el propio Modal compartido */}
            {showQuotations && (
                <QuotationPickerModal
                    value={formData.quotations}
                    onConfirm={(ids) => {
                        setFormData(prev => ({ ...prev, quotations: ids }))
                        setErrors(prev => ({ ...prev, quotations: undefined }))
                    }}
                    onClose={() => setShowQuotations(false)}
                />
            )}
        </div>
    )
}
