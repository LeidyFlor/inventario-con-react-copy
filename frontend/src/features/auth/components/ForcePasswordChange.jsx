import { useNavigate } from "react-router-dom"
import ChangePasswordModal from "@/features/users/components/ChangePasswordModal"
import { clearMustChangePassword } from "../services/passwordFlag"

/**
 * Pantalla del cambio de contraseña obligatorio del primer ingreso.
 *
 * No trae formulario propio: monta el MISMO modal de Mi perfil en modo
 * forced, que esconde el botón Cancelar, no se cierra al hacer clic afuera y
 * llama "Contraseña temporal" al campo de la contraseña actual.
 *
 * Se llega aquí cuando el login devuelve must_change_password en true, y
 * RequirePasswordChange impide salir hasta que se cambie.
 */
export default function ForcePasswordChange() {
    const navigate = useNavigate()

    return (
        <ChangePasswordModal
            forced
            // onClose no se usa en modo forced (no hay Cancelar ni clic afuera),
            // pero el modal lo espera como prop
            onClose={() => {}}
            onSuccess={() => {
                // El backend ya puso must_change_password en false; se limpia
                // la marca local para que el guardián deje pasar al dashboard
                clearMustChangePassword()
                navigate("/dashboard", { replace: true })
            }}
        />
    )
}
