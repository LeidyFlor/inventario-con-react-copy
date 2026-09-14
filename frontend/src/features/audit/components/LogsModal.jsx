import { useState } from "react"
import { Button, Input, Modal } from "@/shared"
import { Alert } from "@/shared/components/utils/alert"
import { peticion, mensajeDeError } from "@/shared/services/peticion"

// Devuelve la fecha local actual en formato YYYY-MM-DD.
// Se usa getFullYear/Month/Date en vez de toISOString() porque toISOString()
// retorna la fecha en UTC, lo cual en Colombia (UTC-5) puede devolver
// el día siguiente a partir de las 7 PM hora local.
const today = () => {
    const d = new Date()
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
    ].join("-")
}

/**
 * Descarga el historial y dispara el "Guardar como" del navegador.
 *
 * Cuando las dos fechas son iguales se manda ?date= en vez del rango: el
 * backend nombra el archivo distinto en cada caso, y para un solo día queda
 * "audit-2026-09-14.log" en vez de "audit-2026-09-14_a_2026-09-14.log".
 */
async function downloadAuditLog(desde, hasta) {
    const token = sessionStorage.getItem("token")
    const query = desde === hasta
        ? `date=${desde}`
        : `desde=${desde}&hasta=${hasta}`

    const response = await peticion(`/api/audit/download/?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
        // mensajeDeError revisa el content-type antes de parsear: con el
        // backend caído la respuesta es HTML, no JSON
        throw new Error(await mensajeDeError(response, "No se pudo descargar el historial"))
    }

    // El nombre del archivo lo decide el backend en Content-Disposition. Se lee
    // de ahí en vez de rearmarlo aquí, para no tener la misma regla escrita en
    // dos lugares. Si el encabezado no llega, se usa uno equivalente.
    const cabecera = response.headers.get("Content-Disposition") ?? ""
    const nombre = cabecera.match(/filename="(.+?)"/)?.[1]
        ?? `audit-${desde === hasta ? desde : `${desde}_a_${hasta}`}.log`

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = nombre
    link.click()
    URL.revokeObjectURL(objectUrl)

    return nombre
}

export default function LogsModal({ isOpen, onClose }) {
    // Ambas arrancan en hoy: es la consulta más frecuente y deja el modal
    // listo para descargar sin tocar nada
    const [desde, setDesde] = useState(today())
    const [hasta, setHasta] = useState(today())
    const [error, setError] = useState("")

    if (!isOpen) return null

    // Las fechas vienen como YYYY-MM-DD, así que se comparan como texto: ese
    // formato ordena igual alfabéticamente que cronológicamente. No hace falta
    // construir objetos Date, que además traen líos de zona horaria.
    const rangoInvertido = Boolean(desde && hasta && desde > hasta)

    const cambiar = (setter) => (e) => {
        setter(e.target.value)
        setError("")
    }

    // Deja las dos fechas en hoy. Es un atajo para el caso más común, no una
    // validación: el usuario puede seguir cambiándolas después.
    const ponerHoy = () => {
        setDesde(today())
        setHasta(today())
        setError("")
    }

    const handleDownload = async () => {
        if (!desde || !hasta) {
            setError("Selecciona la fecha de inicio y la de fin.")
            return
        }
        if (rangoInvertido) {
            setError("La fecha de inicio no puede ser posterior a la de fin.")
            return
        }

        Alert.loading("Descargando historial...")
        try {
            const nombre = await downloadAuditLog(desde, hasta)
            Alert.close()
            await Alert.success(
                "Historial descargado",
                `El archivo ${nombre} fue descargado correctamente.`
            )
            onClose()
        } catch (err) {
            Alert.close()
            Alert.error("Error", err.message)
        }
    }

    return (
        <Modal
            onClose={onClose}
            title="Descargar historial de auditoría"
            titleVariant="gradient"
            size="md"
            cancelLabel="Cancelar"
            confirmLabel="Descargar"
            // Se deshabilita solo por el rango invertido. Faltar una fecha se
            // avisa al pulsar, para que quede claro qué falta en vez de dejar
            // el botón apagado sin explicación.
            confirmDisabled={rangoInvertido}
            onConfirm={handleDownload}
        >
            <p className="text-small text-text-muted">
                Selecciona el rango de fechas del historial que deseas descargar.
                Puedes elegir el mismo día en ambos campos.
            </p>

            {/* El botón ocupa todo el ancho en celular y se recoge a la
                izquierda desde tablet. Va envuelto porque Button es inline-flex
                y no acepta className: el ancho se aplica desde el contenedor. */}
            <div className="flex [&>button]:w-full sm:[&>button]:w-auto">
                <Button
                    variant="primary"
                    size="sm"
                    // El ícono + de primary sugiere "agregar", que aquí no aplica
                    showIcon={false}
                    onClick={ponerHoy}
                >
                    Hoy
                </Button>
            </div>

            {/* Apiladas en celular, lado a lado desde tablet */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Input
                    type="date"
                    label="Fecha de inicio"
                    value={desde}
                    onChange={cambiar(setDesde)}
                    // El tope lo pone la fecha de fin, y nunca el futuro
                    max={hasta || today()}
                    error={rangoInvertido ? " " : undefined}
                    required
                />
                <Input
                    type="date"
                    label="Fecha de fin"
                    value={hasta}
                    onChange={cambiar(setHasta)}
                    // min igual a desde permite elegir el mismo día
                    min={desde || undefined}
                    max={today()}
                    error={rangoInvertido ? " " : undefined}
                    required
                />
            </div>

            {/* Un solo mensaje para los dos campos: el error es del rango, no
                de una fecha en particular */}
            {(error || rangoInvertido) && (
                <p className="text-caption text-error">
                    {error || "La fecha de inicio no puede ser posterior a la de fin."}
                </p>
            )}
        </Modal>
    )
}
