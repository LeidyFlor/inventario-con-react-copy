import { useState } from "react"
import { Input, Button, Modal, Alert, IconButton } from "@/shared"
import { restorePasswordSchema } from "@/features/auth/schemas/restorePasswordSchema"

import { peticion, leerJson, ERROR_RESPUESTA_INVALIDA } from "@/shared/services/peticion";

async function changePassword({ password_actual, password_nueva, password_nueva_confirmacion }) {
    const token = sessionStorage.getItem("token")
    const res = await peticion("/api/users/change-password/", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password_actual, password_nueva, password_nueva_confirmacion }),
    })
    if (!res.ok) {
        // leerJson devuelve null si la respuesta no es JSON (backend caído):
        // así el llamador recibe un objeto vacío en vez de reventar el parseo
        throw (await leerJson(res)) ?? { error: ERROR_RESPUESTA_INVALIDA }
    }
    return res.json()
}

/**
 * Cambio de la contraseña propia. Usa /api/users/change-password/, que actúa
 * sobre el usuario logueado.
 *
 * @param {Function} onClose   Cierra el modal
 * @param {boolean}  forced    Modo obligatorio del primer ingreso: esconde
 *                             Cancelar, no cierra al hacer clic afuera y
 *                             explica por qué hay que cambiarla. La contraseña
 *                             actual es la temporal que llegó por correo.
 * @param {Function} onSuccess Se ejecuta después de cambiarla. Si no se pasa,
 *                             simplemente cierra.
 */
export default function ChangePasswordModal({ onClose, forced = false, onSuccess }) {
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

    // Nombres de los campos de restorePasswordSchema → campos de este modal
    const MAPA_CAMPOS = {
        userPassword:       "password_nueva",
        userPasswordConfir: "password_nueva_confirmacion",
    }

    /**
     * Valida con restorePasswordSchema, el mismo esquema Zod que usa la
     * recuperación de contraseña, para que las reglas sean idénticas por
     * cualquier camino: mínimo 8 caracteres, una mayúscula, una minúscula,
     * un número y un carácter especial.
     *
     * El esquema solo cubre la contraseña nueva y su confirmación, así que la
     * contraseña actual (que no tiene por qué cumplir esas reglas, y de hecho
     * la temporal generada no las cumple) se revisa aparte.
     */
    const validate = () => {
        const newErrors = {}

        if (!formData.password_actual) {
            newErrors.password_actual = forced
                ? "Ingresa la contraseña temporal que recibiste"
                : "Ingresa tu contraseña actual"
        }

        const result = restorePasswordSchema.safeParse({
            userPassword:       formData.password_nueva,
            userPasswordConfir: formData.password_nueva_confirmacion,
        })
        if (!result.success) {
            result.error.issues.forEach((issue) => {
                const campo = MAPA_CAMPOS[issue.path[0]]
                // Se conserva el primer error de cada campo, que es el más
                // específico según el orden en que están escritas las reglas
                if (campo && !newErrors[campo]) newErrors[campo] = issue.message
            })
        }

        if (
            !newErrors.password_nueva &&
            formData.password_nueva &&
            formData.password_nueva === formData.password_actual
        ) {
            newErrors.password_nueva = "La nueva contraseña debe ser distinta a la actual"
        }

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
            Alert.loading("Guardando cambios...")
            await changePassword(formData)
            Alert.close()
            await Alert.success("Contraseña actualizada", "Tu contraseña fue cambiada correctamente.")
            if (onSuccess) onSuccess()
            else onClose()
        } catch (error) {
            Alert.close()
            const msg = error?.error || error?.password_actual?.[0] || "No se pudo cambiar la contraseña."
            Alert.error("Error", msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title="Cambiar contraseña"
            titleVariant="gradient"
            onClose={onClose}
            dismissable={!forced}
            // En modo obligatorio no hay flecha de regreso: la única salida es
            // cambiar la contraseña o cerrar sesión
            onBack={forced ? undefined : onClose}
        >
            {forced && (
                <p className="text-small text-text-primary max-w-xs mb-5 text-center">
                    Estás usando la contraseña temporal que te llegó por correo.
                    Debes cambiarla antes de continuar: si no lo haces dentro de
                    las 2 horas siguientes, tu cuenta se desactivará.
                </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <p className="text-small text-text-primary max-w-xs mb-5 text-center">
                    La contraseña debe de ser de 7-8 caractéres y contener: 1 Mayúscula, 1 Minúscula, 1 Caracter especial, 1 número 
                </p>
                <Input
                    label={forced ? "Contraseña temporal" : "Contraseña actual"}
                    placeholder={forced ? "Contraseña temporal" : "Contraseña actual"}
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

                {/* Cancelar ya no va aquí: esa función la cumple la flecha de
                    regreso del encabezado, que en modo obligatorio no aparece */}
                <Button variant="primary" size="md" type="submit" disabled={loading} showIcon={false}>
                    {loading ? "Guardando..." : "Guardar"}
                </Button>
            </form>
        </Modal>
    )
}
