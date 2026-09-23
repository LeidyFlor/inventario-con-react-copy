import { useState, useEffect } from "react"
import { z } from "zod"
import { Input, Modal, Alert } from "@/shared"
import { getSupportEmail, updateSupportEmail } from "../services/supportEmailService"

// Se usa Zod, como el resto de formularios del sistema, en vez de escribir una
// expresión propia: validar correos a mano se ve fácil y casi siempre queda mal.
// El backend vuelve a validarlo con EmailField, que es la validación que cuenta.
const esquema = z
    .string()
    .trim()
    .min(1, "El correo de soporte es obligatorio")
    .email("El correo electrónico no tiene un formato válido")

/**
 * Cambio del correo de soporte que se muestra en el login y en Mi perfil.
 *
 * Solo lo abre el superadministrador (ver Navbar). El backend lo verifica de
 * nuevo: ocultar la opción del menú no protege el endpoint.
 *
 * No guarda un historial — la tabla tiene una sola fila, así que al guardar el
 * correo anterior queda reemplazado.
 */
export default function SupportEmailModal({ isOpen, onClose }) {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)

    // Se trae el valor vigente para que el campo aparezca con lo que hay hoy,
    // y no en blanco: así se ve qué se está reemplazando.
    useEffect(() => {
        if (!isOpen) return
        setCargando(true)
        getSupportEmail()
            .then(setEmail)
            .catch((err) => setError(err.message))
            .finally(() => setCargando(false))
    }, [isOpen])

    if (!isOpen) return null

    const guardar = async () => {
        const resultado = esquema.safeParse(email)
        if (!resultado.success) {
            setError(resultado.error.issues[0].message)
            return
        }

        setGuardando(true)
        try {
            Alert.loading("Guardando el correo de soporte...")
            // Se guarda el valor recortado, no el que se escribió: un espacio
            // al final es invisible en pantalla pero viaja hasta la base
            const guardado = await updateSupportEmail(resultado.data)
            setEmail(guardado)
            Alert.close()
            await Alert.success(
                "Correo actualizado",
                `El correo de soporte ahora es ${guardado}.`
            )
            onClose()
        } catch (err) {
            Alert.close()
            Alert.error("Error", err.message)
        } finally {
            setGuardando(false)
        }
    }

    return (
        <Modal
            onClose={onClose}
            title="Cambiar correo soporte"
            titleVariant="gradient"
            size="md"
            cancelLabel="Cancelar"
            confirmLabel={guardando ? "Guardando..." : "Guardar"}
            confirmDisabled={cargando || guardando}
            onConfirm={guardar}
        >
            <p className="text-small text-text-muted">
                Este correo se muestra en la pantalla de inicio de sesión y en
                Mi perfil, para que las personas sepan a dónde escribir. Al
                guardar se reemplaza el anterior.
            </p>

            {/* noValidate: la validación es la de Zod, con mensajes en español.
                La del navegador saldría en su propio idioma y con otro texto */}
            <form
                noValidate
                onSubmit={(e) => { e.preventDefault(); guardar() }}
                className="flex flex-col items-center gap-5"
            >
                <Input
                    label="Cambio de correo soporte"
                    placeholder={cargando ? "Cargando..." : "correo@sena.edu.co"}
                    type="email"
                    name="support_email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError("") }}
                    error={error}
                    disabled={cargando}
                    required
                />
            </form>
        </Modal>
    )
}
