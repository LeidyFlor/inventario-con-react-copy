import { useState } from "react"
import { FileInput, Alert, Modal } from "@/shared"
import { uploadQuotations, MAX_ARCHIVOS_POR_TANDA } from "../services/quotationService"

export default function QuotationUploadForm({ onClose, onCreated }) {
    const [files, setFiles] = useState([])
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSubmit = async () => {
        if (files.length === 0) {
            setError("Debes adjuntar al menos un archivo PDF")
            return
        }
        // El backend también lo valida; esto evita el viaje de ida y vuelta
        const noPdf = files.filter(f => !f.name.toLowerCase().endsWith(".pdf"))
        if (noPdf.length) {
            setError(`Solo se admiten archivos PDF. Revisa: ${noPdf.map(f => f.name).join(", ")}`)
            return
        }

        setSaving(true)
        try {
            Alert.loading("Subiendo cotizaciones...")
            const creadas = await uploadQuotations(files)
            onCreated(creadas)
            Alert.close()
            await Alert.success(
                creadas.length === 1 ? "Cotización subida" : "Cotizaciones subidas",
                `Se ${creadas.length === 1 ? "registró" : "registraron"} ${creadas.length} cotización(es).`
            )
            onClose()
        } catch (err) {
            Alert.close()
            setError(err.message || "No se pudieron subir las cotizaciones")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            onClose={onClose}
            title="Subir cotizaciones"
            titleVariant="gradient"
            size="md"
            cancelLabel="Cancelar"
            confirmLabel={saving ? "Subiendo..." : "Subir"}
            confirmDisabled={saving}
            onConfirm={handleSubmit}
        >
            <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-text-muted text-small">
                    Solo archivos PDF, hasta {MAX_ARCHIVOS_POR_TANDA} por vez.
                    Cada archivo queda como una cotización independiente.
                </p>
                <FileInput
                    value={files}
                    onChange={(nuevos) => { setFiles(nuevos); setError("") }}
                    multiple={true}
                    maxFiles={MAX_ARCHIVOS_POR_TANDA}
                    accept="application/pdf"
                />
                {error && <span className="text-red-800 text-sm">{error}</span>}
            </div>
        </Modal>
    )
}
