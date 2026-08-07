import { useState } from "react"
import { Input, Alert, Modal } from "@/shared"
import { updateCategory } from "../services/categoryService"

export default function CategoryEditForm({ category, onClose, onUpdated }) {
    const [name, setName] = useState(category?.name ?? "")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e?.preventDefault?.()
        if (!name.trim()) {
            setError("El nombre de la categoría es obligatorio")
            return
        }
        setSaving(true)
        try {
            Alert.loading("Actualizando categoría...")
            const actualizada = await updateCategory(category.id, name.trim())
            onUpdated(actualizada)
            Alert.close()
            await Alert.success(
                "Categoría actualizada",
                `"${actualizada.name}" fue actualizada correctamente.`
            )
            onClose()
        } catch (err) {
            Alert.close()
            try {
                const errObj = JSON.parse(err.message)
                const first = Object.values(errObj)[0]
                setError(Array.isArray(first) ? first[0] : String(first))
            } catch {
                setError("No se pudo actualizar la categoría")
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            onClose={onClose}
            title="Editar categoría"
            titleVariant="gradient"
            size="md"
            cancelLabel="Cancelar"
            confirmLabel={saving ? "Guardando..." : "Guardar"}
            confirmDisabled={saving}
            onConfirm={handleSubmit}
        >
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <Input
                    placeholder="Nombre de la categoría"
                    label="Nombre"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError("") }}
                    name="name"
                    error={error}
                    required
                />
            </form>
        </Modal>
    )
}
