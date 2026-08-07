import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { Button, IconButton, Input, Select, Textarea, Alert, Modal } from "@/shared";
import DataTable from "@/shared/components/DataTable";
import { getLoan, returnLoan } from "../services/loanService";
import { getUserName } from "../services/selectService";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";

// Envoltorio delgado sobre el Modal compartido. Conserva la firma
// (isOpen / title / onClose) que ya usan las llamadas de esta pantalla,
// para no tener que tocarlas.
function MaterialModal({ title, isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
        <Modal
            title={title}
            titleVariant="gradient"
            size="xl"
            onBack={onClose}
            onClose={onClose}
        >
            {children}
        </Modal>
    );
}

// ─── Opciones de estado (modo simple) ────────────────────────────────────────
const STATE_OPTIONS = [
    { label: "Bueno",   value: "bueno"   },
    { label: "Dañado",  value: "dañado"  },
    { label: "Perdido", value: "perdido" },
];

// ─── Determina si un ítem usa distribución de estados ────────────────────────
// Solo herramientas devolutivas sin placa SENA con cantidad > 1
const isMultiState = (item) =>
    item.tipo !== "Consumo" && !item.placaSena && item.cantidad > 1;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReturnLoan() {
    const { id }   = useParams();
    const navigate = useNavigate();

    const [loan, setLoan]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [userOptions, setUserOptions] = useState([]);
    const [returnedBy, setReturnedBy]   = useState("");
    /**
     * itemStates shape:
     *   modo simple   → { qty: number|"", state: "bueno"|"dañado"|"perdido" }
     *   modo distribución → { bueno: number, danado: number, perdido: number }
     */
    const [itemStates, setItemStates]   = useState({});
    const [observations, setObservations] = useState("");
    const [activeModal, setActiveModal] = useState(null);

    useEffect(() => {
        Promise.all([getLoan(id), getUserName()])
            .then(([data, users]) => {
                setLoan(data);
                setUserOptions(users);
                if (data.requesterId) setReturnedBy(String(data.requesterId));

                const init = {};
                (data.loanMaterials ?? []).forEach(item => {
                    if (isMultiState(item)) {
                        init[item.id] = {
                            bueno:   item.qtyBueno   ?? 0,
                            danado:  item.qtyDanado  ?? 0,
                            perdido: item.qtyPerdido ?? 0,
                        };
                    } else {
                        init[item.id] = {
                            qty:   item.cantidadDevuelta ?? 0,
                            state: item.itemState ?? "bueno",
                        };
                    }
                });
                setItemStates(init);
            })
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

    // Un préstamo finalizado ya no se puede devolver. En LoanRowActions la
    // opción del menú se oculta, pero esto cubre el caso de entrar escribiendo
    // la URL a mano. Se redirige a la pantalla de consulta, donde sí se ven las
    // cantidades devueltas y sus estados.
    if (loan.loanStatus === "finalizado") {
        return <Navigate to={`/dashboard/loans/${id}/view`} replace />;
    }

    // ── Handlers modo simple ───────────────────────────────────────────────────
    const handleQtyChange = (itemId, raw) => {
        const digits = raw.replace(/\D/g, "");
        if (digits === "") {
            setItemStates(prev => ({ ...prev, [itemId]: { ...prev[itemId], qty: "" } }));
            return;
        }
        const max = loan.loanMaterials.find(m => m.id === itemId)?.cantidad ?? 0;
        setItemStates(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], qty: Math.min(Number(digits), max) },
        }));
    };

    const handleQtyBlur = (itemId) => {
        setItemStates(prev => {
            const cur = prev[itemId]?.qty;
            return { ...prev, [itemId]: { ...prev[itemId], qty: cur === "" ? 0 : cur } };
        });
    };

    const handleStateChange = (itemId, state) => {
        setItemStates(prev => ({ ...prev, [itemId]: { ...prev[itemId], state } }));
    };

    // ── Handlers modo distribución ─────────────────────────────────────────────
    const handleDistribChange = (itemId, key, raw) => {
        const digits = raw.replace(/\D/g, "");
        const val    = digits === "" ? 0 : Number(digits);
        const max    = loan.loanMaterials.find(m => m.id === itemId)?.cantidad ?? 0;

        setItemStates(prev => {
            const cur     = prev[itemId] ?? { bueno: 0, danado: 0, perdido: 0 };
            const updated = { ...cur, [key]: val };
            const total   = updated.bueno + updated.danado + updated.perdido;
            if (total > max) return prev;   // rechazar si supera el máximo
            return { ...prev, [itemId]: updated };
        });
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!returnedBy) {
            Alert.error("Campo requerido", "Selecciona quién devuelve el préstamo.");
            return;
        }

        const items = loan.loanMaterials.map(item => {
            const s = itemStates[item.id];
            if (isMultiState(item)) {
                const bueno   = Number(s?.bueno   ?? 0);
                const danado  = Number(s?.danado  ?? 0);
                const perdido = Number(s?.perdido ?? 0);
                return {
                    loan_item_id:      item.id,
                    quantity_returned: bueno + danado + perdido,
                    states:            { bueno, danado, perdido },
                };
            }
            return {
                loan_item_id:      item.id,
                quantity_returned: Number(s?.qty ?? 0),
                item_state:        s?.state ?? "bueno",
            };
        });

        try {
            Alert.loading("Registrando devolución...");
            await returnLoan(id, {
                returnedBy:         Number(returnedBy),
                items,
                returnObservations: observations,
            });
            Alert.close();
            await Alert.success("Devolución registrada", "El préstamo fue devuelto correctamente.");
            navigate("/dashboard/loan-list");
        } catch (err) {
            console.error(err);
            Alert.close();
            try {
                const parsed = JSON.parse(err.message);
                const raw    = parsed.error ?? parsed.items;
                const text   = Array.isArray(raw) ? raw[0] : (raw ?? "No se pudo registrar la devolución. Verifica los datos.");
                Alert.error("Error al registrar", text);
            } catch {
                Alert.error("Error al registrar", "No se pudo registrar la devolución. Verifica los datos.");
            }
        }
    };

    const returnableItems = loan.loanMaterials.filter(m => m.tipo !== "Consumo");
    const consumableItems = loan.loanMaterials.filter(m => m.tipo === "Consumo");

    // ── Columnas tabla devolutivos ─────────────────────────────────────────────
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
            id: "devueltos_estado",
            header: "Devueltos / Estado",
            cell: ({ row }) => {
                const item = row.original;

                // ── Modo distribución (herramienta sin placa, cantidad > 1) ──
                if (isMultiState(item)) {
                    const s     = itemStates[item.id] ?? { bueno: 0, danado: 0, perdido: 0 };
                    const max   = item.cantidad;
                    const total = (s.bueno ?? 0) + (s.danado ?? 0) + (s.perdido ?? 0);
                    return (
                        <div className="flex flex-col gap-1 min-w-52 py-1">
                            {[
                                { key: "bueno",   label: "Bueno",   color: "text-success" },
                                { key: "danado",  label: "Dañado",  color: "text-warning" },
                                { key: "perdido", label: "Perdido", color: "text-error"   },
                            ].map(({ key, label, color }) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className={`text-small font-semibold w-16 ${color}`}>{label}</span>
                                    <div className="w-16">
                                        <Input
                                            type="text"
                                            variant="isEdit"
                                            inputMode="numeric"
                                            value={s[key] ?? 0}
                                            onChange={e => handleDistribChange(item.id, key, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                            <span className="text-small text-text-muted mt-1">
                                Total: {total} / {max}
                            </span>
                        </div>
                    );
                }

                // ── Modo simple 
                const s   = itemStates[item.id] ?? { qty: 0, state: "bueno" };
                const max = item.cantidad;
                return (
                    <div className="flex items-center gap-2 min-w-56 py-1">
                        <div className="w-16">
                            <Input
                                variant="isEdit"
                                type="text"
                                inputMode="numeric"
                                value={s.qty ?? 0}
                                onChange={e => handleQtyChange(item.id, e.target.value)}
                                onBlur={() => handleQtyBlur(item.id)}
                            />
                        </div>
                        <span className="text-text-muted text-sm whitespace-nowrap">/ {max}</span>
                        <div className="w-32">
                            <Select
                                variant="isEdit"
                                options={STATE_OPTIONS}
                                value={s.state ?? "bueno"}
                                onChange={e => handleStateChange(item.id, e.target.value)}
                            />
                        </div>
                    </div>
                );
            },
        },
    ];

    // ── Columnas tabla consumibles (siempre modo simple) ──────────────────────
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
            id: "devueltos_estado",
            header: "Devueltos / Estado",
            cell: ({ row }) => {
                const item = row.original;
                const s    = itemStates[item.id] ?? { qty: 0, state: "bueno" };
                const max  = item.cantidad;
                return (
                    <div className="flex items-center gap-2 min-w-56 py-1">
                        <div className="w-16">
                            <Input
                                variant="isEdit"
                                type="text"
                                inputMode="numeric"
                                value={s.qty ?? 0}
                                onChange={e => handleQtyChange(item.id, e.target.value)}
                                onBlur={() => handleQtyBlur(item.id)}
                            />
                        </div>
                        <span className="text-text-muted text-sm whitespace-nowrap">/ {max}</span>
                        <div className="w-32">
                            <Select
                                variant="isEdit"
                                options={STATE_OPTIONS}
                                value={s.state ?? "bueno"}
                                onChange={e => handleStateChange(item.id, e.target.value)}
                            />
                        </div>
                    </div>
                );
            },
        },
    ];

    // ── Render 
    return (
        <div>
            <div className="flex flex-col place-items-center justify-items-center relative">
                <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">

                    {/* Encabezado */}
                    <div className="flex flex-col md:flex-row mb-6 gap-10 md:justify-between place-items-center">
                        <div>
                            <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                                <RefreshCcw className="text-brand" />
                                Regresar material devolutivo/consumo
                            </h1>
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
                        <div className="flex flex-col md:flex-row w-full justify-between gap-10">

                            {/* Columna izquierda */}
                            <div className="flex flex-col gap-6 place-items-center justify-center">
                                <Select
                                    label="Devuelto por"
                                    name="returnedBy"
                                    options={userOptions}
                                    value={returnedBy}
                                    onChange={e => setReturnedBy(e.target.value)}
                                />
                                <h2 className="font-bold text-body">Selecciona los materiales a devolver</h2>
                                <div className="flex gap-3 justify-center">
                                    {returnableItems.length > 0 && (
                                        <Button type="button" variant="primary" size="md"
                                            onClick={() => setActiveModal("returnable")}>
                                            Devolutivo
                                        </Button>
                                    )}
                                    {consumableItems.length > 0 && (
                                        <Button type="button" variant="primary" size="md"
                                            onClick={() => setActiveModal("consumable")}>
                                            Consumible
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Columna derecha */}
                            <div className="flex flex-col gap-10 mt-4 md:mt-0">
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
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal: materiales devolutivos */}
            <MaterialModal
                title="Materiales devolutivos del préstamo"
                isOpen={activeModal === "returnable"}
                onClose={() => setActiveModal(null)}
            >
                <div className="overflow-y-auto">
                    <DataTable data={returnableItems} columns={returnableColumns} />
                </div>
                <div className="mt-4 pt-4 border-t border-brand flex justify-end">
                    <IconButton onClick={() => setActiveModal(null)}>Confirmar</IconButton>
                </div>
            </MaterialModal>

            {/* Modal: materiales consumibles */}
            <MaterialModal
                title="Materiales consumibles del préstamo"
                isOpen={activeModal === "consumable"}
                onClose={() => setActiveModal(null)}
            >
                <div className="overflow-y-auto">
                    <DataTable data={consumableItems} columns={consumableColumns} />
                </div>
                <div className="mt-4 pt-4 border-t border-brand flex justify-end">
                    <IconButton onClick={() => setActiveModal(null)}>Confirmar</IconButton>
                </div>
            </MaterialModal>
        </div>
    );
}
