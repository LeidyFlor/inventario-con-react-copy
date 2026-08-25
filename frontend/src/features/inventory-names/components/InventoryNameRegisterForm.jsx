import { useState } from "react"
import { Input, Alert, Modal } from "@/shared"
import { createInventoryName } from "../services/inventoryNameService"

export default function InventoryNameRegisterForm({ onClose, onCreated }) {
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        // Se usa tanto desde el submit del formulario (Enter) como desde el
        // botón del pie del Modal, que no dispara submit
        e?.preventDefault?.()
        if (!name.trim()) {
            setError("El nombre de inventario es obligatorio")
            return
        }
        setSaving(true)
        try {
            Alert.loading("Creando nombre de inventario...")
            const nuevo = await createInventoryName(name.trim())
            onCreated(nuevo)
            Alert.close()
            await Alert.success(
                "Inventario creado",
                `"${nuevo.name}" fue registrado correctamente.`
            )
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
        <Modal
            onClose={onClose}
            title="Registro de nombre de inventario"
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
