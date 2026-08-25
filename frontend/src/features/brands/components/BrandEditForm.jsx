import { useState } from "react"
import { Input, IconButton, Alert, Button } from "@/shared"
import { Tags } from "lucide-react"
import { updateBrand } from "../services/brandService"

export default function BrandEditForm({ brand, onClose, onUpdated }) {
    const [name, setName] = useState(brand?.name ?? "")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) {
            setError("El nombre de la marca es obligatorio")
            return
        }
        setSaving(true)
        try {
            Alert.loading("Actualizando marca...")
            const updated = await updateBrand(brand.id, name.trim())
            onUpdated(updated)
            Alert.close()
            await Alert.success("Marca actualizada", `"${updated.name}" fue actualizada correctamente.`)
            onClose()
        } catch (err) {
            Alert.close()
            // El servicio ya entrega el mensaje listo: antes aquí se
            // parseaba un JSON metido dentro del texto del error
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Tags className="text-brand" />
                        Editar marca
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                    <Input
                        placeholder="Nombre de la marca"
                        label="Nombre"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError("") }}
                        name="name"
                        error={error}
                    />
                    <div className="flex gap-3">
                        <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button variant="primary" size="md" type="submit" disabled={saving} >
                            {saving ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
