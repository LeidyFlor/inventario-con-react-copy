// src/features/returnable-material/components/ReturnableEditForm.jsx
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FilePenLine } from "lucide-react"
import { Input, Button, Select, FileInput, Textarea, Alert, TechnicalFilesInput } from "@/shared"
import { getBrands, getInventoryManagers, getMaterialCategories } from "../services/selectService"
import {
    getReturnables,
    uploadTechnicalFiles,
    deleteTechnicalFile,
} from "../services/returnableService"
import { returnableMaterialSchema } from "../schemas/returnableMaterialSchema"

const API_URL = "/api"

// Llama al PATCH para editar el material (campos de texto + imagen opcional)
async function updateReturnable(id, formData, newImageFile) {
    const token = sessionStorage.getItem("token")
    const data = new FormData()

    data.append("brand",formData.brandName)
    data.append("inventory_manager",formData.inventoryManager)
    data.append("material_name",formData.materialName)
    data.append("material_description",formData.materialDescription)
    data.append("material_barcode_sena",formData.materialBarcodeSena)
    data.append("material_unit_price",formData.materialUnitPrice)
    data.append("material_location",formData.materialLocation || "")
    data.append("material_model",formData.returnableMaterialModel)
    data.append("material_serial",formData.returnableMaterialSerial)
    data.append("material_category",formData.returnableMaterialCategory)
    if (formData.returnableMaterialDimensions) {
        data.append("material_dimensions", formData.returnableMaterialDimensions)
    }
    if (newImageFile) {
        data.append("material_image", newImageFile)
    }

    const response = await fetch(`${API_URL}/returnable-materials/${id}/`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` },
        body: data,
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
    }
    return response.json()
}

export default function ReturnableEditForm() {
    const { id } = useParams()
    const navigate = useNavigate()

    //  Estado del formulario 
    const [formData, setFormData] = useState({
        materialBarcodeSena:"",
        brandName:"",
        returnableMaterialModel:"",
        materialName:"",
        inventoryManager:"",
        materialDescription:"",
        materialUnitPrice:"",
        materialLocation:"",
        returnableMaterialSerial:"",
        returnableMaterialCategory:"",
        returnableMaterialDimensions:"",
    })
    const [errors,  setErrors]  = useState({})
    const [loading, setLoading] = useState(true)   // cargando datos del backend
    const [saving,  setSaving]  = useState(false)  // enviando el PATCH

    //  Imagen principal 
    const [currentImage,   setCurrentImage]   = useState(null)  // URL del backend
    const [newImageFiles,  setNewImageFiles]  = useState([])    // File[] si el usuario cambia la imagen
    const [showFileInput,  setShowFileInput]  = useState(false)

    //  Fichas técnicas (vienen del backend)
    const [existingFiles,  setExistingFiles]  = useState([])// [{id, file_url, file_name}] del backend
    const [newTechFiles,   setNewTechFiles]   = useState([])// File[] nuevos
    const [removedFileIds, setRemovedFileIds] = useState([])// IDs a eliminar al guardar

    //  Opciones de selects 
    const [brands,setBrands]= useState([])
    const [managers,setManagers]= useState([])
    const categories = getMaterialCategories()

    //  Carga inicial — material + selects 
    useEffect(() => {
        async function load() {
            try {
                // Cargamos el listado y buscamos por ID
                // (si hubiera un endpoint GET /returnable-materials/{id}/ lo usaríamos directamente)
                const [all, brands, managers] = await Promise.all([
                    getReturnables(),
                    getBrands(),
                    getInventoryManagers(),
                ])

                const material = all.find(m => String(m.id) === String(id))
                if (!material) return

                // Llenar el formulario con los datos del backend
                setFormData({
                    materialBarcodeSena:material.material_barcode_sena ?? "",
                    brandName:String(material.brand),
                    returnableMaterialModel:material.material_model ?? "",
                    materialName:material.material_name ?? "",
                    inventoryManager:String(material.inventory_manager),
                    materialDescription:material.material_description ?? "",
                    materialUnitPrice:material.material_unit_price ?? "",
                    materialLocation:material.material_location ?? "",
                    returnableMaterialSerial:material.material_serial ?? "",
                    returnableMaterialCategory:material.material_category ?? "",
                    returnableMaterialDimensions:material.material_dimensions ?? "",
                })

                setCurrentImage(material.material_image ?? null)
                setExistingFiles(material.technical_files ?? [])
                setBrands(brands)
                setManagers(managers)
            } catch {
                Alert.error("Error", "No se pudo cargar el material")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    //  Handlers 
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

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
            setSaving(true)

            // 1. PATCH del material (campos + imagen nueva si la hay)
            await updateReturnable(
                id,
                result.data,
                newImageFiles.length > 0 ? newImageFiles[0] : null
            )

            // 2. Eliminar fichas técnicas que el usuario removió
            for (const fileId of removedFileIds) {
                await deleteTechnicalFile(id, fileId)
            }

            // 3. Subir fichas técnicas nuevas
            if (newTechFiles.length > 0) {
                await uploadTechnicalFiles(id, newTechFiles)
            }

            Alert.success("Material actualizado", "Los cambios fueron guardados correctamente")
            navigate("/dashboard/returnable-material-list")
        } catch (err) {
            Alert.error("Error", "No se pudo guardar los cambios. Intenta de nuevo.")
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    //  Loading 
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-text-muted">Cargando material...</p>
            </div>
        )
    }

    //  Render 
    return (
        <div className="flex flex-col place-items-center justify-items-center w-full">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full mt-2">

                {/* Título */}
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <FilePenLine className="text-brand" />
                        Editar material devolutivo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form
                    className="flex flex-col lg:grid lg:grid-flow-col-dense items-start gap-8"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {/*  Columna izquierda: imagen + fichas técnicas  */}
                    <div className="flex flex-col gap-6 items-center">

                        {/* Imagen principal */}
                        <div className="flex flex-col gap-3 items-center">
                            <h2 className="font-bold text-body">Imagen del elemento</h2>
                            <p className="text-text-muted text-small w-72 text-center">
                                1 archivo: PDF, PNG, JPG. Máx 10MB.
                            </p>

                            {/* Muestra imagen actual mientras no se reemplaza */}
                            {!showFileInput && (
                                currentImage ? (
                                    <img
                                        src={newImageFiles.length > 0
                                            ? URL.createObjectURL(newImageFiles[0])
                                            : currentImage}
                                        alt="Imagen del material"
                                        className="w-48 h-48 object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                        <span className="text-2xl font-bold">
                                            {formData.materialName?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )
                            )}

                            {!showFileInput ? (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => setShowFileInput(true)}
                                >
                                    Cambiar imagen
                                </Button>
                            ) : (
                                <FileInput
                                    value={newImageFiles}
                                    onChange={(files) => {
                                        setNewImageFiles(files)
                                        if (files.length > 0) setShowFileInput(false)
                                    }}
                                    multiple={false}
                                />
                            )}
                        </div>

                        {/* Fichas técnicas — mezcla archivos del backend + nuevos */}
                        <div className="flex flex-col gap-3 items-center">
                            <h2 className="font-bold text-body">Fichas técnicas</h2>
                            <p className="text-text-muted text-small w-72 text-center">
                                Los archivos marcados "Guardado" ya están en el sistema.
                                Puedes agregar más o eliminar los existentes.
                            </p>
                            <TechnicalFilesInput
                                existingFiles={existingFiles}
                                onRemoveExisting={(fileId) => {
                                    setExistingFiles(prev => prev.filter(f => f.id !== fileId))
                                    setRemovedFileIds(prev => [...prev, fileId]) //acumula para borrarlo al guardar
                                }}
                                newFiles={newTechFiles}
                                onNewFilesChange={setNewTechFiles}
                                accept="image/*,application/pdf"
                            />
                        </div>
                    </div>

                    {/*  Columna derecha: campos del material  */}
                    <div className="grid grid-cols-dense bg-background border-2 border-border-edit-informaion p-8 rounded-xl">
                        <div className="md:grid md:grid-cols-[160px_1fr] items-center gap-4">

                            <p className="parrafo-edit-style">Placa SENA:</p>
                            <Input
                                name="materialBarcodeSena"
                                value={formData.materialBarcodeSena}
                                onChange={handleChange}
                                error={errors.materialBarcodeSena}
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

                            <p className="parrafo-edit-style">Marca:</p>
                            <Select
                                options={brands}
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

                            <p className="parrafo-edit-style">Nombre:</p>
                            <Input
                                name="materialName"
                                value={formData.materialName}
                                onChange={handleChange}
                                error={errors.materialName}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Cuentadante:</p>
                            <Select
                                options={managers}
                                name="inventoryManager"
                                value={formData.inventoryManager}
                                onChange={handleChange}
                                error={errors.inventoryManager}
                                variant="isEdit"
                            />

                            <p className="parrafo-edit-style">Categoría:</p>
                            <Select
                                options={categories}
                                name="returnableMaterialCategory"
                                value={formData.returnableMaterialCategory}
                                onChange={handleChange}
                                error={errors.returnableMaterialCategory}
                                variant="isEdit"
                            />

                            {/* Dimensiones solo aparece para muebles_enseres */}
                            {formData.returnableMaterialCategory === "muebles_enseres" && (
                                <>
                                    <p className="parrafo-edit-style">Dimensiones:</p>
                                    <Input
                                        name="returnableMaterialDimensions"
                                        value={formData.returnableMaterialDimensions}
                                        onChange={handleChange}
                                        error={errors.returnableMaterialDimensions}
                                        placeholder="Ej: 120x75x20cm"
                                        variant="isEdit"
                                    />
                                </>
                            )}

                            <p className="parrafo-edit-style">Valor unitario:</p>
                            <Input
                                type="number"
                                name="materialUnitPrice"
                                value={formData.materialUnitPrice}
                                onChange={handleChange}
                                error={errors.materialUnitPrice}
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

                            <p className="parrafo-edit-style">Descripción:</p>
                            <Textarea
                                name="materialDescription"
                                value={formData.materialDescription}
                                onChange={handleChange}
                                error={errors.materialDescription}
                                variant="isEdit"
                            />

                            {/* Botones */}
                            <div className="place-items-start mt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <Button
                                    variant="primary"
                                    size="md"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? "Guardando..." : "Guardar"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
