import { useState } from "react"
import { ScrollText } from "lucide-react"
import { Button, Input } from "@/shared"
import { Alert } from "@/shared/components/utils/alert"

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

async function downloadAuditLog(date) {
    const token = sessionStorage.getItem("token")
    const url = `/api/audit/download/?date=${date}`

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? "No se pudo descargar el log")
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = `audit-${date}.log`
    link.click()
    URL.revokeObjectURL(objectUrl)
}

export default function LogsModal({ isOpen, onClose }) {
    const [date, setDate] = useState(today())

    if (!isOpen) return null

    const handleDownload = async () => {
        Alert.loading("Descargando log...")
        try {
            await downloadAuditLog(date)
            Alert.close()
            await Alert.success("Log descargado", `El archivo audit-${date}.log fue descargado correctamente.`)
            onClose()
        } catch (err) {
            Alert.error("Error", err.message)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-lg">
                <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
                    <ScrollText size={20} className="text-brand" />
                    Descargar log de auditoría
                </h2>
                <p className="mb-6 text-small text-text-muted">
                    Selecciona la fecha del log que deseas descargar.
                </p>

                <div className="mb-6">
                    <Input
                        type="date"
                        label="Fecha"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={today()}
                    />
                </div>

                <div className="flex justify-between gap-2">
                    <Button variant="secondary" onClick={onClose} autoFocus>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleDownload}>
                        Descargar
                    </Button>
                </div>
            </div>
        </div>
    )
}
