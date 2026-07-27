import { useEffect } from "react";
import { sendHeartbeat } from "../services/heartbeatService";

// Cada cuánto se envía el latido. Debe ser bastante menor que el periodo de
// gracia del backend (5 minutos) para que una recarga o un pestañeo de red
// nunca se acerque a esa ventana. Con pocos usuarios no genera tráfico
// relevante; con más usuarios, 2 minutos evita saturar el servidor.
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos

/**
 * Mantiene viva la sesión mientras el dashboard está montado.
 *
 * No hace falta enviar un latido inmediato al montar: el login ya arranca
 * el reloj en el backend (last_heartbeat_at se setea ahí), así que el primer
 * latido de este intervalo llega bastante antes de que se cumplan los 5
 * minutos de gracia.
 */
export function useHeartbeat() {
    useEffect(() => {
        const id = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
        return () => clearInterval(id);
    }, []);
}
