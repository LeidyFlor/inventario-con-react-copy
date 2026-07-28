import { Navigate } from "react-router-dom"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"
import { usePermissions } from "../context/PermissionsContext"

/**
 * Guard de ruta por permiso.
 *
 * Bloquea el acceso a una página cuando el usuario no tiene el permiso
 * requerido, incluso si escribe la URL directamente en el navegador.
 *
 * Esto evita que la página se monte y dispare peticiones que fallarían
 * con 403 (y que mostrarían la alerta de acceso denegado varias veces).
 *
 * La seguridad real está en el backend; esto es para la experiencia de uso.
 *
 * Uso en el router:
 *   { path: "task-create", element: (
 *       <RequirePerm perm={PERM.USER_CHANGE}><CreateTaskPage /></RequirePerm>
 *   )}
 *
 * anyOf — basta con tener uno de los permisos:
 *   <RequirePerm anyOf={[PERM.LOAN_VIEW, PERM.LOAN_CHANGE]}>...</RequirePerm>
 *
 * allOf — se exigen todos. Útil cuando una pantalla consulta varios recursos
 * al montarse y fallaría con 403 si le falta alguno. Por ejemplo el formulario
 * de tareas carga usuarios y grupos además de las tareas.
 *   <RequirePerm allOf={[PERM.USER_CHANGE, PERM.USER_LIST]}>...</RequirePerm>
 */
export default function RequirePerm({ perm, anyOf, allOf, superuserOnly = false, children }) {
    const { hasPerm, hasAnyPerm, isSuperuser, loading } = usePermissions()

    // Mientras se cargan los permisos no se decide nada todavía
    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando...</p>
        </div>
    )

    let allowed
    if (superuserOnly)   allowed = isSuperuser
    else if (allOf)      allowed = allOf.every(p => hasPerm(p))
    else if (anyOf)      allowed = hasAnyPerm(anyOf)
    else                 allowed = hasPerm(perm)

    // Sin permiso se devuelve al inicio del dashboard.
    // replace evita que quede en el historial y el usuario vuelva con "atrás".
    if (!allowed) return <Navigate to="/dashboard" replace />

    return children
}
