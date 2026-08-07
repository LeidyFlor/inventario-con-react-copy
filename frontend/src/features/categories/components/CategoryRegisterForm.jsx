import { useState } from "react"
import { Input, Alert, Modal } from "@/shared"
import { createCategory } from "../services/categoryService"

export default function CategoryRegisterForm({ onClose, onCreated }) {
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        // Se usa tanto desde el submit del formulario (Enter) como desde el
        // botón del pie del Modal, que no dispara submit
        e?.preventDefault?.()
        if (!name.trim()) {
            setError("El nombre de la categoría es obligatorio")
            return
        }
        setSaving(true)
        try {
            Alert.loading("Creando categoría...")
            const nueva = await createCategory(name.trim())
            onCreated(nueva)
            Alert.close()
            await Alert.success("Categoría creada", `"${nueva.name}" fue registrada correctamente.`)
            onClose()
        } catch (err) {
            Alert.close()
            try {
                const errObj = JSON.parse(err.message)
                const first = Object.values(errObj)[0]
                setError(Array.isArray(first) ? first[0] : String(first))
            } catch {
                setError("No se pudo crear la categoría")
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            onClose={onClose}
            title="Registro de categoría"
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
