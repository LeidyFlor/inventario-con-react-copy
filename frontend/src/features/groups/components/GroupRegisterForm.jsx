import { useState } from "react"
import { Input, Alert, Button } from "@/shared"
import { Users } from "lucide-react"
import { createGroup } from "../services/groupService";

export default function GroupRegisterForm({ onClose, onCreated }) {
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) {
            setError("El nombre del grupo es obligatorio")
            return
        }
        setSaving(true)
        try {
            const newGroup = await createGroup(name.trim())
            onCreated(newGroup)
            await Alert.success("Grupo creado", `"${newGroup.name}" fue registrado correctamente.`)
            onClose()
        } catch (err) {
            try {
                const errObj = JSON.parse(err.message)
                const first = Object.values(errObj)[0]
                setError(Array.isArray(first) ? first[0] : String(first))
            } catch {
                setError("No se pudo crear el grupo")
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Users className="text-brand" />
                        Registro de grupo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                    <Input
                        placeholder="Nombre del grupo"
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
                        <Button variant="primary" size="md" type="submit" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}