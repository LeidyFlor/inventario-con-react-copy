import { useState } from "react"
import { Input, Alert, Modal } from "@/shared"
import { updateInventoryName } from "../services/inventoryNameService"

export default function InventoryNameEditForm({ inventoryName, onClose, onUpdated }) {
    const [name, setName] = useState(inventoryName?.name ?? "")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e?.preventDefault?.()
        if (!name.trim()) {
            setError("El nombre de inventario es obligatorio")
            return
        }
        setSaving(true)
        try {
            Alert.loading("Actualizando nombre de inventario...")
            const actualizado = await updateInventoryName(inventoryName.id, name.trim())
            onUpdated(actualizado)
            Alert.close()
            await Alert.success(
                "Inventario actualizado",
                `"${actualizado.name}" fue actualizado correctamente.`
            )
            onClose()
        } catch (err) {
            Alert.close()
            try {
                const errObj = JSON.parse(err.message)
                const first = Object.values(errObj)[0]
                setError(Array.isArray(first) ? first[0] : String(first))
            } catch {
                setError("No se pudo actualizar el nombre de inventario")
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            onClose={onClose}
            title="Editar nombre de inventario"
            titleVariant="gradient"
            size="md"
            cancelLabel="Cancelar"
            confirmLabel={saving ? "Guardando..." : "Guardar"}
            confirmDisabled={saving}
            onConfirm={handleSubmit}
        >
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <Input
                    placeholder="Nombre del inventario"
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
