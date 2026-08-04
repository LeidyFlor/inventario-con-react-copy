import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardList, Handshake } from "lucide-react";
import { Button, IconButton, Textarea, Alert } from "@/shared";
import DataTable from "@/shared/components/DataTable";
import { getLoan, acceptReturn } from "../services/loanService";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
//  Modal reutilizable (idéntico al de MaterialsLoan) 
function MaterialModal({ title, isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full flex flex-col max-h-[90vh] rounded-2xl bg-background p-5 shadow-2xl max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <Button variant="secondary" onClick={onClose}>Atrás</Button>
                    {title && (
                        <h2 className="text-gradient-title text-h3 font-bold flex-1 pl-56">{title}</h2>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Badge de estado
const STATE_LABELS = { bueno: "Bueno", dañado: "Dañado", perdido: "Perdido" };

function StateBadge({ state }) {
    const base = "inline-block px-2 py-1 rounded-full text-small font-semibold whitespace-nowrap";
    const color =
        state === "bueno"  ? "bg-success/20 text-success" :
        state === "dañado" ? "bg-warning/20 text-primary" :
                             "bg-error/20 text-error";
    return <span className={`${base} ${color}`}>{STATE_LABELS[state] ?? state}</span>;
}

// Muestra la distribución de estados cuando hay datos por cantidad
function StateDistrib({ bueno, danado, perdido }) {
    return (
        <div className="flex flex-col gap-1">
            {bueno   > 0 && <span className="text-small font-semibold text-success">Bueno: {bueno}</span>}
            {danado  > 0 && <span className="text-small font-semibold text-primary">Dañado: {danado}</span>}
            {perdido > 0 && <span className="text-small font-semibold text-error">Perdido: {perdido}</span>}
            {bueno === 0 && danado === 0 && perdido === 0 && <span className="text-text-muted text-small">—</span>}
        </div>
    );
}

// ─── Componente principal 
export default function ApproveReturnLoan() {
    const { id }   = useParams();
    const navigate = useNavigate();

    const [loan, setLoan]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [observations, setObservations] = useState("");
    // "returnable" | "consumable" | null
    const [activeModal, setActiveModal] = useState(null);

    useEffect(() => {
        getLoan(id)
            .then(setLoan)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2 mt-20">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando préstamo...</p>
        </div>
    );
    if (!loan) return <p>Préstamo no encontrado</p>;

    const formatDateTime = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleString("es-CO", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    // Cuando el préstamo ya está finalizado la pantalla pasa a modo consulta:
    // se sigue pudiendo entrar (aquí queda el registro de quién aceptó la
    // devolución y cuándo), pero se ocultan el campo de observación y el botón
    // de envío. El backend también rechaza la acción en este estado
    // (loans/views.py, accept_return), así que esto es solo para no mostrar
    // un formulario que de todos modos no va a funcionar.
    const finalizado = loan.loanStatus === "finalizado";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!loan.returnedAt) {
            Alert.error("Sin devolución", "Este préstamo aún no ha sido devuelto.");
            return;
        }
        if (loan.acceptedAt) {
            Alert.error("Ya aceptado", "La devolución de este préstamo ya fue aceptada.");
            return;
        }
        try {
            Alert.loading("Aceptando retorno...");
            await acceptReturn(id, { acceptObservations: observations });
            Alert.close();
            await Alert.success("Retorno aceptado", "La devolución fue aceptada correctamente.");
            navigate("/dashboard/loan-list");
        } catch (err) {
            console.error(err);
            Alert.close();
            Alert.error("No se pudo aceptar la devolución", err);
        }
    };

    const returnableItems = (loan.loanMaterials ?? []).filter(m => m.tipo !== "Consumo");
    const consumableItems = (loan.loanMaterials ?? []).filter(m => m.tipo === "Consumo");

    // ── Columnas tabla devolutivos (solo lectura) 
    const returnableColumns = [
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => (
                <span className="block min-w-40 py-3">{row.original.name}</span>
            ),
        },
        {
            accessorKey: "placaSena",
            header: "Placa SENA",
            cell: ({ row }) => (
                <span className="block min-w-28 py-3 whitespace-nowrap">
                    {row.original.placaSena ?? "—"}
                </span>
            ),
        },
        {
            accessorKey: "serial",
            header: "S/N",
            cell: ({ row }) => (
                <span className="block min-w-28 py-3 whitespace-nowrap">
                    {row.original.serial ?? "—"}
                </span>
            ),
        },
        {
            accessorKey: "cantidad",
            header: "Prestados",
            cell: ({ row }) => (
                <span className="block min-w-16 py-3 text-center">{row.original.cantidad}</span>
            ),
        },
        {
            accessorKey: "cantidadDevuelta",
            header: "Devueltos",
            cell: ({ row }) => (
                <span className="block min-w-16 py-3 text-center">{row.original.cantidadDevuelta}</span>
            ),
        },
        {
            id: "estado",
            header: "Estado",
            cell: ({ row }) => {
                const item = row.original;
                // Si tiene distribución por cantidad, mostrarla
                if (item.qtyBueno !== null || item.qtyDanado !== null || item.qtyPerdido !== null) {
                    return (
                        <StateDistrib
                            bueno={item.qtyBueno   ?? 0}
                            danado={item.qtyDanado ?? 0}
                            perdido={item.qtyPerdido ?? 0}
                        />
                    );
                }
                return <StateBadge state={item.itemState} />;
            },
        },
    ];

    // ── Columnas tabla consumibles (solo lectura)
    const consumableColumns = [
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => (
                <span className="block min-w-40 py-3">{row.original.name}</span>
            ),
        },
        {
            accessorKey: "cantidad",
            header: "Prestados",
            cell: ({ row }) => (
                <span className="block min-w-16 py-3 text-center">{row.original.cantidad}</span>
            ),
        },
        {
            accessorKey: "cantidadDevuelta",
            header: "Devueltos",
            cell: ({ row }) => (
                <span className="block min-w-16 py-3 text-center">{row.original.cantidadDevuelta}</span>
            ),
        },
        {
            id: "estado",
            header: "Estado",
            cell: ({ row }) => <StateBadge state={row.original.itemState} />,
        },
    ];

    // ── Render 
    return (
        <>
            <div className="flex flex-col place-items-center justify-items-center relative">
                <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">

                    {/* Encabezado */}
                    <div className="flex flex-col md:flex-row mb-6  gap-10 md:justify-between place-items-center">
                        <div className="">
                            <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                                <Handshake className="text-brand" />
                                Aceptar retorno préstamo
                            </h1>{/*linea degradada del titulo*/}
                            <div className="h-0.5 bg-gradiant-title-line"></div>

                        </div>
                        <div>
                            <div className="flex gap-2 mb-1 justify-center">
                                <h2 className="font-bold text-body">ID préstamo:</h2>
                                <h2 className="text-body">{loan.idLoan}</h2>
                            </div>
                            <div className="h-0.5 bg-border-line-subtitle w-full"></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="flex flex-row mx-2 place-items-center w-full">
                        <div className="flex flex-col md:flex-row w-full justify-between">

                            {/* Columna izquierda */}
                            <div className="flex flex-col gap-6 place-items-center justify-center">

                                {/* Info de quién devolvió */}
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-body">Devuelto por:</span>
                                        <span className="text-body">{loan.returnedByName ?? "—"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-body">Fecha devolución:</span>
                                        <span className="text-body">{formatDateTime(loan.returnedAt)}</span>
                                    </div>
                                    {loan.returnObservations && (
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-body">Observación devolución:</span>
                                            <span className="text-body text-text-muted">{loan.returnObservations}</span>
                                        </div>
                                    )}
                                </div>

                                <h2 className="font-bold text-body">Revisa los materiales retornados</h2>
                                <div className="flex gap-3 justify-center">
                                    {returnableItems.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="md"
                                            onClick={() => setActiveModal("returnable")}
                                        >
                                            Devolutivo
                                        </Button>
                                    )}
                                    {consumableItems.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="md"
                                            onClick={() => setActiveModal("consumable")}
                                        >
                                            Consumible
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Columna derecha: observación y submit */}
                            <div className="flex flex-col gap-10 mt-4 md:mt-0">
                                {finalizado ? (
                                    /* Solo lectura: datos de la aceptación ya registrada */
                                    <div className="flex flex-col gap-2 w-full md:max-w-xs">
                                        <span className="inline-block w-fit px-3 py-1 rounded-full text-small font-semibold bg-background text-brand">
                                            Préstamo finalizado
                                        </span>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-body">Aceptado por:</span>
                                            <span className="text-body">{loan.acceptedByName ?? "—"}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-bold text-body">Fecha aceptación:</span>
                                            <span className="text-body">{formatDateTime(loan.acceptedAt)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-body">Observación aceptación:</span>
                                            <span className="text-body text-text-muted">
                                                {loan.acceptObservations || "Sin observaciones"}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Textarea
                                            label="Observación"
                                            placeholder="Observación"
                                            value={observations}
                                            onChange={e => setObservations(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <IconButton variant="primary" size="md" type="submit">
                                                Aceptar
                                            </IconButton>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal: materiales devolutivos (solo lectura) */}
            <MaterialModal
                title="Materiales devolutivos retornados"
                isOpen={activeModal === "returnable"}
                onClose={() => setActiveModal(null)}
            >
                <div className="overflow-y-auto">
                    <DataTable data={returnableItems} columns={returnableColumns} />
                </div>
                <div className="mt-4 pt-4 border-t border-brand flex justify-end">
                    <IconButton onClick={() => setActiveModal(null)}>
                        Ok
                    </IconButton>
                </div>
            </MaterialModal>

            {/* Modal: materiales consumibles (solo lectura) */}
            <MaterialModal
                title="Materiales consumibles retornados"
                isOpen={activeModal === "consumable"}
                onClose={() => setActiveModal(null)}
            >
                <div className="overflow-y-auto">
                    <DataTable data={consumableItems} columns={consumableColumns} />
                </div>
                <div className="mt-4 pt-4 border-t border-brand flex justify-end">
                    <IconButton onClick={() => setActiveModal(null)}>
                        Ok
                    </IconButton>
                </div>
            </MaterialModal>
        </>
    );
}
