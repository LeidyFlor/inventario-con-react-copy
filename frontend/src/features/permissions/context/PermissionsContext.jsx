import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { getMyPermissions } from "../services/permissionsService"
// Se importa Alert desde su archivo y NO desde el barril "@/shared".
// El barril exporta DashboardLayout, que a su vez importa este contexto:
// eso creaba una importación circular y hacía que PermissionsContext fuera
// undefined al evaluarse RequirePerm ("usePermissions debe usarse dentro
// de <PermissionsProvider>" aunque el provider sí estuviera montado).
import { Alert } from "@/shared/components/utils/alert.js"

const PermissionsContext = createContext(null)

/**
 * Hook para consultar los permisos del usuario logueado.
 *
 *   const { hasPerm, isSuperuser, loading } = usePermissions()
 *   if (hasPerm("materials.add_brand")) { ... }
 *
 * Los permisos se guardan SOLO en memoria (estado de React), nunca en
 * sessionStorage, para que no quede una copia vieja manipulable desde DevTools.
 */
export function usePermissions() {
    const ctx = useContext(PermissionsContext)
    if (!ctx) {
        throw new Error("usePermissions debe usarse dentro de <PermissionsProvider>")
    }
    return ctx
}

export function PermissionsProvider({ children }) {
    const navigate = useNavigate()
    const [permissions, setPermissions] = useState([])
    const [isSuperuser, setIsSuperuser] = useState(false)
    const [isStaff, setIsStaff]         = useState(false)
    const [loading, setLoading]         = useState(true)

    // Ref para que el interceptor de fetch siempre lea la versión actual
    // de refresh sin necesidad de re-registrarse en cada render
    const refreshRef = useRef(null)

    // Evita que se apilen varias alertas cuando una misma pantalla dispara
    // varias peticiones y todas responden 403 (ej: un formulario que carga
    // usuarios, grupos y estados al montarse)
    const handling403Ref = useRef(false)

    // Mismo propósito que el anterior, pero para 401 (sesión inválida).
    // Ej: si el heartbeat y otra petición fallan casi al mismo tiempo tras
    // el cierre de sesión por inactividad, solo se avisa una vez.
    const handling401Ref = useRef(false)

    const refresh = useCallback(async () => {
        // Sin token no tiene sentido pedir permisos (usuario no logueado)
        if (!sessionStorage.getItem("token")) {
            setPermissions([])
            setLoading(false)
            return
        }
        // Con la base remota esta petición puede tardar varios segundos.
        // Sin aviso, el menú aparece vacío mientras tanto y se malinterpreta
        // como "no tengo permisos". El Alert es modal a propósito: impide
        // hacer clic en una interfaz que todavía no refleja lo que se puede.
        Alert.loading("Cargando permisos", "Estamos preparando tu sesión...")
        try {
            const data = await getMyPermissions()
            setPermissions(data.permissions ?? [])
            setIsSuperuser(Boolean(data.is_superuser))
            setIsStaff(Boolean(data.is_staff))
        } catch {
            setPermissions([])
        } finally {
            // En el finally para que se cierre también si la petición falla
            Alert.close()
            setLoading(false)
        }
    }, [])

    refreshRef.current = refresh

    // Carga inicial al montar el dashboard
    useEffect(() => { refresh() }, [refresh])

    // ──────────────────────────────────────────────────────────────
    // Interceptor global de respuestas 401 y 403
    //
    // Se envuelve window.fetch una sola vez para no tener que modificar
    // los ~20 archivos de servicios que usan fetch directamente.
    //
    // 403 = estás autenticado pero sin permiso. NO se toca el token, la
    //       sesión sigue viva.
    // 401 = el token ya no es válido (expiró, se inició sesión en otro
    //       dispositivo, o el backend la cerró por inactividad de la
    //       pestaña tras 5 minutos sin heartbeat). Aquí sí se limpia la
    //       sesión local y se manda al login.
    // ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const originalFetch = window.fetch

        window.fetch = async (...args) => {
            const response = await originalFetch(...args)

            // Solo interceptar llamadas a nuestra propia API
            const url = typeof args[0] === "string" ? args[0] : args[0]?.url ?? ""
            const isOwnApi = url.includes("/api/")

            // El cierre de sesión se queda por fuera: si su token ya no vale,
            // el backend responde 401 y eso NO es una sesión caída, es
            // exactamente lo que se estaba pidiendo. Sin esta excepción,
            // cerrar sesión mostraba la alerta de "Sesión finalizada" como si
            // hubiera ocurrido un problema.
            const esLogout = url.includes("/api/users/logout/")

            // El heartbeat también: es una llamada de fondo cada 2 minutos.
            // Si llega justo después de cerrar sesión, su 401 no debe
            // disparar la alerta de sesión caída. Cuando la sesión sí se cae
            // de verdad, la siguiente petición real del usuario lo detecta.
            const esHeartbeat = url.includes("/api/users/heartbeat/")

            if (
                response.status === 401 && isOwnApi &&
                !esLogout && !esHeartbeat && !handling401Ref.current
            ) {
                handling401Ref.current = true

                sessionStorage.removeItem("token")
                Alert.error(
                    "Sesión finalizada",
                    "Tu sesión se cerró. Inicia sesión de nuevo para continuar."
                )
                navigate("/auth")

                setTimeout(() => { handling401Ref.current = false }, 1000)
                return response
            }

            if (response.status === 403 && isOwnApi && !handling403Ref.current) {
                // Bandera para que varias peticiones simultáneas que fallen
                // con 403 no muestren la alerta más de una vez
                handling403Ref.current = true

                // Se recargan los permisos por si cambiaron mientras navegaba
                await refreshRef.current?.()
                Alert.error(
                    "Acceso denegado",
                    "No tienes permiso para acceder a esta sección."
                )
                navigate("/dashboard")

                // Se libera la bandera pasado un momento, para que un 403
                // posterior en otra pantalla sí vuelva a avisar
                setTimeout(() => { handling403Ref.current = false }, 1000)
            }

            return response
        }

        // Restaurar el fetch original al desmontar
        return () => { window.fetch = originalFetch }
    }, [navigate])

    /**
     * Verifica si el usuario tiene un permiso concreto.
     * El superusuario siempre pasa, igual que en el backend.
     */
    const hasPerm = useCallback(
        (perm) => isSuperuser || permissions.includes(perm),
        [permissions, isSuperuser]
    )

    /**
     * Verifica si el usuario tiene AL MENOS UNO de varios permisos.
     * Sirve para decidir si se muestra el botón completo de un módulo:
     * si no tiene ninguno de sus permisos, el módulo entero se oculta.
     */
    /**
     * True solo si tiene TODOS los permisos de la lista.
     *
     * Es el compañero de hasAnyPerm y se usa con los conjuntos de SCREEN_PERMS:
     * una pantalla suele consultar varios recursos al montarse, y si le falta
     * uno el backend responde 403. Con esto el botón que lleva a esa pantalla
     * se oculta en vez de terminar en "Acceso denegado".
     */
    const hasAllPerms = useCallback(
        (perms = []) => perms.every(p => hasPerm(p)),
        [hasPerm],
    )

    const hasAnyPerm = useCallback(
        (perms) => isSuperuser || perms.some((p) => permissions.includes(p)),
        [permissions, isSuperuser]
    )

    return (
        <PermissionsContext.Provider
            value={{ permissions, hasPerm, hasAnyPerm, hasAllPerms, isSuperuser, isStaff, loading, refresh }}
        >
            {children}
        </PermissionsContext.Provider>
    )
}
