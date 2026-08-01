import { Navigate, useLocation } from "react-router-dom"
import { getMustChangePassword } from "../services/passwordFlag"

// Ruta donde vive el formulario de cambio obligatorio
const RUTA_CAMBIO = "/dashboard/change-password"

/**
 * Mientras el usuario siga con la contraseña temporal, lo devuelve al
 * formulario de cambio sin importar a qué pantalla intente ir.
 *
 * Envuelve el contenido del dashboard, así que cubre tanto los enlaces del
 * menú como las URLs escritas a mano. La única salida es cambiar la
 * contraseña o cerrar sesión, que limpia la marca.
 */
export default function RequirePasswordChange({ children }) {
    const { pathname } = useLocation()

    if (getMustChangePassword() && pathname !== RUTA_CAMBIO) {
        return <Navigate to={RUTA_CAMBIO} replace />
    }

    return children
}
