import { useState } from "react"
import { KeyRound } from "lucide-react"
import { Input, Button, Modal, Alert, IconButton } from "@/shared"

async function changePassword({ password_actual, password_nueva, password_nueva_confirmacion }) {
    const token = sessionStorage.getItem("token")
    const res = await fetch("/api/users/change-password/", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password_actual, password_nueva, password_nueva_confirmacion }),
    })
    if (!res.ok) {
        const error = await res.json()
        throw error
    }
    return res.json()
}

export default function ChangePasswordModal({ onClose }) {
    const [formData, setFormData] = useState({
        password_actual: "",
        password_nueva: "",
        password_nueva_confirmacion: "",
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setErrors(prev => ({ ...prev, [name]: "" }))
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.password_actual)
            newErrors.password_actual = "Ingresa tu contraseña actual"
        if (!formData.password_nueva)
            newErrors.password_nueva = "Ingresa la nueva contraseña"
        else if (formData.password_nueva.length < 8)
            newErrors.password_nueva = "Mínimo 8 caracteres"
        if (!formData.password_nueva_confirmacion)
            newErrors.password_nueva_confirmacion = "Confirma la nueva contraseña"
        else if (formData.password_nueva !== formData.password_nueva_confirmacion)
            newErrors.password_nueva_confirmacion = "Las contraseñas no coinciden"
        return newErrors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = validate()
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }

        try {
            setLoading(true)
            await changePassword(formData)
            await Alert.success("Contraseña actualizada", "Tu contraseña fue cambiada correctamente.")
            onClose()
        } catch (error) {
            const msg = error?.error || error?.password_actual?.[0] || "No se pudo cambiar la contraseña."
            Alert.error("Error", msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal onClose={onClose}>
            <div className="mb-6 max-w-max">
                <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                    <KeyRound className="text-brand" />
                    Cambiar contraseña
                </h1>
                <div className="h-0.5 bg-gradiant-title-line"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <Input
                    label="Contraseña actual"
                    placeholder="Contraseña actual"
                    type="password"
                    name="password_actual"
                    value={formData.password_actual}
                    onChange={handleChange}
                    error={errors.password_actual}
                />
                <Input
                    label="Nueva contraseña"
                    placeholder="Nueva contraseña"
                    type="password"
                    name="password_nueva"
                    value={formData.password_nueva}
                    onChange={handleChange}
                    error={errors.password_nueva}
                />
                <Input
                    label="Confirmar nueva contraseña"
                    placeholder="Confirmar nueva contraseña"
                    type="password"
                    name="password_nueva_confirmacion"
                    value={formData.password_nueva_confirmacion}
                    onChange={handleChange}
                    error={errors.password_nueva_confirmacion}
                />

                <div className="flex gap-3">
                    <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="md" type="submit" disabled={loading} showIcon={false}>
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
