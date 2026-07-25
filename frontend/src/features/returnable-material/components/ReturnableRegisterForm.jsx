// src/features/returnable-material/components/ReturnableRegisterForm.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Router } from "lucide-react"
import { Input, Button, Select, FileInput, Textarea, Alert, IconButton } from "@/shared"
import { getBrands, getInventoryManagers, getMaterialCategories } from "../services/selectService"
import { createReturnable } from "../services/returnableService"
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema"

export default function ReturnableRegisterForm() {
    const navigate = useNavigate()

    // ── Estado del formulario 
    const [formData, setFormData] = useState({
        materialBarcodeSena: "",
        brandName: "",
        returnableMaterialModel:"",
        materialName:"",
        inventoryManager:"",
        materialDescription:  "",
        materialUnitPrice:"",
        materialLocation:"",
        materialQuantity: "",
        returnableMaterialSerial:"",
        returnableMaterialCategory:"",
        returnableMaterialDimensions:  "",
        materialImage: [],
        materialTechnicalSheet: [],
    })
    const [errors, setErrors]   = useState({})
    const [loading, setLoading] = useState(false)

    //  Opciones de selects 
    const [brands,     setBrands]     = useState([])
    const [managers,   setManagers]   = useState([])
    // Las categorías son constantes — se inicializan directamente
    const categories = getMaterialCategories()

    useEffect(() => {
        getBrands().then(setBrands)
        getInventoryManagers().then(setManagers)
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
                <div className="mb-3 max-w-max">
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
                    <div className="flex flex-col items-center gap-6">

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
                    </div>

                    {/*  Columna de campos  */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">

                        {/* Columna izquierda */}
                        <div className="flex flex-col gap-2">
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
                                label="Serial"
                                placeholder="Serial del elemento"
                                name="returnableMaterialSerial"
                                value={formData.returnableMaterialSerial}
                                onChange={handleChange}
                                error={errors.returnableMaterialSerial}
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
                            <Select
                                label="Cuentadante"
                                options={managers}
                                name="inventoryManager"
                                value={formData.inventoryManager}
                                onChange={handleChange}
                                error={errors.inventoryManager}
                                required
                            />
                            <Textarea
                                label="Descripción"
                                placeholder="Descripción del elemento"
                                name="materialDescription"
                                value={formData.materialDescription}
                                onChange={handleChange}
                                error={errors.materialDescription}
                                required
                            />
                        </div>

                        {/* Columna derecha */}
                        <div className="flex flex-col gap-2">
                            <Select
                                label="Categoría"
                                options={categories}
                                name="returnableMaterialCategory"
                                value={formData.returnableMaterialCategory}
                                onChange={handleChange}
                                error={errors.returnableMaterialCategory}
                                required
                            />
                            <Select
                                label="Marca"
                                options={brands}
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                error={errors.brandName}
                                required
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
                            {formData.returnableMaterialCategory === "herramienta" && !formData.materialBarcodeSena?.trim() && (
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
                            {/* Dimensiones solo aparece si la categoría es muebles_enseres */}
                            {formData.returnableMaterialCategory === "muebles_enseres" && (
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
        </div>
    )
}
