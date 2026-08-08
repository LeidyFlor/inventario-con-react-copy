import { useState, useEffect } from "react"
import { ExternalLink, Eye } from "lucide-react"
import { Modal, Checkbox, IconButtonReal, Alert } from "@/shared"
import { getQuotations } from "../services/quotationService"
import { abrirCotizacion } from "../table/quotationsColumns"

/**
 * Modal para elegir las cotizaciones de un material, y para verlas en las
 * pantallas de visualizar.
 *
 * Tiene dos modos:
 *
 *   - Selección (por defecto): muestra el catálogo completo con una casilla
 *     por fila. Al llegar al tope las casillas sin marcar se deshabilitan.
 *   - Solo lectura (readOnly): muestra únicamente las que ya tiene el
 *     material, sin casillas. Es el modo que usan las pantallas de visualizar.
 *
 * Desde aquí NO se suben archivos: eso se hace en Configuración → Cotizaciones.
 *
 * @param {Array}    value       Ids ya elegidos, como texto
 * @param {Function} onConfirm   Recibe el arreglo de ids al aceptar
 * @param {Function} onClose     Cierra el modal
 * @param {boolean}  readOnly    Solo lectura
 * @param {Array}    quotations  En readOnly, las cotizaciones del material
 * @param {number}   max         Tope de cotizaciones. Debe coincidir con
 *                               MAX_COTIZACIONES en
 *                               backend/backend_sigi/modules/materials/serializers.py
 * @param {number}   min         Mínimo exigido. Igual, espeja MIN_COTIZACIONES
 */
export default function QuotationPickerModal({
    value = [],
    onConfirm,
    onClose,
    readOnly = false,
    quotations: quotationsProp,
    max = 3,
    min = 1,
}) {
    // En solo lectura las cotizaciones llegan por prop; en selección se pide
    // el catálogo completo al backend
    const [catalogo, setCatalogo] = useState(quotationsProp ?? [])
    const [loading, setLoading] = useState(!readOnly)
    const [seleccion, setSeleccion] = useState(value.map(String))

    useEffect(() => {
        if (readOnly) return
        getQuotations()
            .then(setCatalogo)
            .catch(() => Alert.error("Error", "No se pudieron cargar las cotizaciones"))
            .finally(() => setLoading(false))
    }, [readOnly])

    const alcanzoTope = seleccion.length >= max

    const alternar = (id) => {
        const texto = String(id)
        setSeleccion(prev =>
            prev.includes(texto)
                ? prev.filter(x => x !== texto)
                // La casilla ya viene deshabilitada al llegar al tope; este
                // guardia es por si acaso
                : (prev.length >= max ? prev : [...prev, texto])
        )
    }

    const confirmar = () => {
        if (seleccion.length < min) {
            Alert.error(
                "Faltan cotizaciones",
                `Debes elegir al menos ${min} cotización para el material.`
            )
            return
        }
        onConfirm(seleccion)
        onClose()
    }

    // En selección se muestra todo el catálogo; en solo lectura, solo las del
    // material, que ya vienen filtradas por prop
    const filas = catalogo

    return (
        <Modal
            onClose={onClose}
            title={readOnly ? "Cotizaciones del material" : "Elegir cotizaciones"}
            titleVariant="gradient"
            size="lg"
            cancelLabel={readOnly ? "Cerrar" : "Cancelar"}
            confirmLabel={readOnly ? undefined : "Aceptar"}
            onConfirm={readOnly ? undefined : confirmar}
        >
            {!readOnly && (
                <p className="text-text-muted text-small text-center">
                    Elige de {min} a {max} cotizaciones. Puedes abrir cada archivo
                    para revisarlo antes de marcarlo.
                    {alcanzoTope && " Ya alcanzaste el máximo."}
                </p>
            )}

            {loading ? (
                <p className="text-text-muted text-center py-4">Cargando cotizaciones...</p>
            ) : filas.length === 0 ? (
                <p className="text-text-muted text-center py-4">
                    {readOnly
                        ? "Este material no tiene cotizaciones."
                        : "No hay cotizaciones cargadas. Súbelas desde Configuración → Cotizaciones."}
                </p>
            ) : (
                <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-border-green-container">
                                <th className="py-2 pr-2 font-semibold">Cotización</th>
                                <th className="py-2 px-2 font-semibold w-20 text-center">Visualizar</th>
                                {!readOnly && (
                                    <th className="py-2 pl-2 font-semibold w-20 text-center">Elegir</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map(cotizacion => {
                                const marcada = seleccion.includes(String(cotizacion.id))
                                return (
                                    <tr key={cotizacion.id} className="border-b border-border-green-container/40">
                                        {/* min-w-0 + truncate: los nombres de archivo son
                                            largos y sin esto estiran la tabla */}
                                        <td className="py-2 pr-2 min-w-0">
                                            <span className="block truncate" title={cotizacion.file_name}>
                                                {cotizacion.file_name}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <IconButtonReal
                                                variant="ghost"
                                                onClick={() => abrirCotizacion(cotizacion.file_url)}
                                                ariaLabel={`Abrir ${cotizacion.file_name}`}
                                                hitSize={36}
                                                iconSize={18}
                                            >
                                                <Eye size={18} />
                                            </IconButtonReal>
                                        </td>
                                        {!readOnly && (
                                            <td className="py-2 pl-2 text-center self-center">
                                                <Checkbox
                                                    // El Checkbox es un <label> con display flex:
                                                    // text-center del <td> no lo mueve, justify-center sí
                                                    className="justify-center"
                                                    id={`cotizacion-${cotizacion.id}`}
                                                    name={`cotizacion-${cotizacion.id}`}
                                                    checked={marcada}
                                                    onChange={() => alternar(cotizacion.id)}
                                                    // Al llegar al tope solo se pueden desmarcar
                                                    disabled={!marcada && alcanzoTope}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {!readOnly && (
                <p className="text-center text-small text-text-muted">
                    {seleccion.length} de {max} elegidas
                </p>
            )}
        </Modal>
    )
}
