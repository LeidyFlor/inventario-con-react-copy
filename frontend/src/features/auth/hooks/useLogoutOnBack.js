import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/logoutService";

/**
 * Cierra la sesión cuando el usuario intenta salir del dashboard con el botón
 * "atrás" del navegador.
 * Al montar, se inserta una entrada extra en el historial (pushState) apuntando
 * a la misma URL. Así el "atrás" no sale de la aplicación: primero consume esa
 * entrada de más y dispara el evento popstate, que es donde se hace el logout.
 *
 * El logout borra el token de sessionStorage y también el current_token_jti de
 * la base de datos, así que la sesión queda realmente cerrada. Si después la
 * persona presiona "adelante", ProtectedRoute no encuentra token y la devuelve
 * al login.
 *
 * Solo se usa en el Home del dashboard. Navegar hacia atrás entre pantallas
 * internas sigue funcionando normal, porque este hook no está montado ahí.
 */
export function useLogoutOnBack() {
    const navigate = useNavigate();
    // Evita que dos popstate seguidos disparen dos logout simultáneos
    const cerrandoRef = useRef(false);

    useEffect(() => {
        // Entrada "colchón": el primer atrás cae aquí y no saca de la app
        window.history.pushState(null, "", window.location.href);

        const handlePopState = async () => {
            if (cerrandoRef.current) return;
            cerrandoRef.current = true;

            try {
                await logout();
            } catch {
                // Si el backend no responde, igual se limpia el token local
                sessionStorage.removeItem("token");
            }

            // replace para que el login no quede encima de una entrada del
            // dashboard: si presiona atrás otra vez, no vuelve a entrar
            navigate("/auth", { replace: true });
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [navigate]);
}
