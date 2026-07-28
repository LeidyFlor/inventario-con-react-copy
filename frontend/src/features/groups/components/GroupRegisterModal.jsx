// src/features/groups/components/GroupRegisterModal.jsx
// Modal para crear un grupo al vuelo desde cualquier formulario que lo necesite.
// Al guardar llama onGroupCreated({value, label}) para que el padre
// agregue el grupo al select y lo deje seleccionado.

import { useState } from "react"
import { UsersRound } from "lucide-react"
import { Input, Button } from "@/shared"
import { Alert } from "@/shared"
import { createGroup } from "../services/groupService"

export default function GroupRegisterModal({ onClose, onGroupCreated }) {
    const [groupName, setGroupName] = useState("")
    const [error,     setError]     = useState("")
    const [loading,   setLoading]   = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!groupName.trim()) {
            setError("El nombre del grupo no puede estar vacío")
            return
        }
        setError("")

        try {
            setLoading(true)
            const newGroup = await createGroup(groupName.trim())
            await Alert.success("Grupo creado", `El grupo "${newGroup.name}" fue creado correctamente.`)
            onGroupCreated({ value: newGroup.id, label: newGroup.name })
            onClose()
        } catch {
            Alert.error("Error", "No se pudo crear el grupo. Intenta de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center relative">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">

                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <UsersRound className="text-brand" />
                        Crear grupo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                    <Input
                        label="Nombre del grupo"
                        placeholder="Ej: Instructor, Aprendiz..."
                        name="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        error={error}
                        required
                    />

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creando..." : "Crear grupo"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
