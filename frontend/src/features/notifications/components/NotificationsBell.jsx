import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellDot, ClipboardList, ListTodo } from "lucide-react";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared";
import {
    getNotifications,
    marcarComoVisto,
    hayNovedades,
} from "../services/notificationService";

/**
 * Campana de notificaciones del Header.
 *
 * No hay tabla de notificaciones: el backend arma la lista al vuelo desde las
 * tareas y los préstamos (ver notification_views.py). Aquí solo se pinta.
 *
 * Qué muestra depende de los permisos, y eso lo decide el backend:
 *   - Tareas: las propias y las de los grupos del usuario, solo pendientes o
 *     en progreso. Llevan a Mi perfil con esa tarea abierta.
 *   - Préstamos: los últimos 5, solo si puede listarlos y verlos. Llevan a la
 *     pantalla de ver el préstamo.
 *
 * El punto del BellDot se enciende cuando hay algo posterior a la última vez
 * que se abrió el menú, que es lo más cercano a "no leído" sin tabla.
 */
export default function NotificationsBell() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [novedades, setNovedades] = useState(false);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        getNotifications()
            .then(data => {
                setItems(data.items ?? []);
                setNovedades(hayNovedades(data.ultima_fecha));
            })
            // Silencioso a propósito: las notificaciones son accesorias, no
            // vale la pena interrumpir con una alerta si fallan
            .catch(() => setItems([]))
            .finally(() => setCargando(false));
    }, []);

    // Al abrir se apaga el punto: ya se vieron
    const alAbrir = () => {
        if (novedades) {
            marcarComoVisto();
            setNovedades(false);
        }
    };

    const Icono = novedades ? BellDot : Bell;

    return (
        <div className="p-2" onClick={alAbrir}>
            <Dropdown>
                <DropdownTrigger>
                    {/* Mismo variant que el botón de usuario, que va justo al lado */}
                    <IconButtonReal
                        label="Notificaciones"
                        arialLabel="Menu de notificaciones"
                        variant="primary"
                        style={{ width: "auto", height: "auto" }}
                    >
                        <Icono />
                    </IconButtonReal>
                </DropdownTrigger>

                <DropdownContent className="right-0 w-72">
                    {cargando ? (
                        <p className="px-3 py-3 text-small text-text-muted text-center">
                            Cargando...
                        </p>
                    ) : items.length === 0 ? (
                        <p className="px-3 py-3 text-small text-text-muted text-center">
                            No tienes notificaciones.
                        </p>
                    ) : (
                        items.map((n, i) => (
                            // La navegación va en el onClick del propio ítem, no
                            // en un botón interno: DropdownItem YA es un
                            // <button>, y anidar otro es HTML inválido y hace
                            // que el clic se dispare dos veces.
                            //
                            // "group" permite que el ícono y el detalle sigan el
                            // hover de toda la fila. Sin eso solo cambiaban al
                            // pasar el mouse justo encima de ellos, porque
                            // traen su propio color y no heredan el del padre.
                            <DropdownItem
                                key={`${n.tipo}-${i}`}
                                onClick={() => navigate(n.destino)}
                                className="group"
                            >
                                <span className="flex items-start gap-2 w-full text-left">
                                    <span className="shrink-0 mt-0.5 text-brand group-hover:text-text-inverse transition-colors">
                                        {n.tipo === "tarea"
                                            ? <ListTodo size={16} />
                                            : <ClipboardList size={16} />}
                                    </span>
                                    {/* min-w-0 permite que el truncate funcione
                                        dentro del contenedor flex */}
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold" title={n.titulo}>
                                            {n.tipo === "tarea" ? `Tarea: ${n.titulo}` : n.titulo}
                                        </span>
                                        <span className="block truncate text-small text-text-muted group-hover:text-text-inverse transition-colors">
                                            {n.detalle}
                                        </span>
                                    </span>
                                </span>
                            </DropdownItem>
                        ))
                    )}
                </DropdownContent>
            </Dropdown>
        </div>
    );
}
