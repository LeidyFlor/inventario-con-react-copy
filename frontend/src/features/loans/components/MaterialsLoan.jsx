import { useState, useEffect } from "react";
import { Button, Checkbox, IconButton, Input } from "@/shared";
import DataTable from "@/shared/components/DataTable";
import { ArrowLeft, CheckCheck } from "lucide-react";
import { getMaterials } from "@/features/consumable-material/services/materialService";
import { getReturnables } from "@/features/returnable-material/services/returnableService";

// Constantes para evitar escribir estos strings directamente en la lógica
const available = "Disponible";
const returnable_type = "Devolutivo";
const consumable_type = "Consumo";

// Etiquetas legibles para las categorías de devolutivos
const CATEGORY_LABELS = {
    herramienta:       "Herramienta",
    maquinaria_equipos: "Maquinaria y equipos",
    muebles_enseres:   "Muebles y enseres",
};
const formatCategory = (value) => CATEGORY_LABELS[value] ?? value;

// Busca el valor de un campo en un objeto probando varios posibles nombres de clave,
// útil porque los datos locales y los del backend pueden usar nombres distintos para el mismo campo
const getField = (item, ...keys) => {
    const key = keys.find((currentKey) => item[currentKey] !== undefined);
    return key ? item[key] : "";
};

// Backdrop cierra el modal al hacer click fuera del contenido
function MaterialModal({ title, isOpen, onClose, children }) {
    // Si no está abierto no se monta nada en el DOM
    if (!isOpen) return null;

    return (
        // z-50 para que quede por encima del resto de la página; el click aquí llama onClose
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
            onClick={onClose}
        >
            {/* stopPropagation evita que el click dentro del panel propague al backdrop */}
            <div
                className="w-full flex flex-col max-h-[90vh] rounded-2xl bg-background p-5 shadow-2xl max-w-5xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <div>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                        >
                            Atrás
                        </Button>
                    </div>
                    {title && <h2 className="text-gradient-title text-h3 font-bold flex-1 pl-56">{title}</h2>}
                </div>
                {children}
            </div>
        </div>
    );
}

// Celda de tabla que se muestra atenuada cuando la fila no está seleccionada
function DisabledCell({ active, children, className = "" }) {
    return (
        <span className={`block py-3 ${active ? "text-text-primary" : "text-text-muted opacity-55"} ${className}`}>
            {children}
        </span>
    );
}

// Componente del paso 1 del préstamo: permite elegir materiales devolutivos y consumibles
export default function MaterialsLoan({ selectedMaterials, setSelectedMaterials }) {
    // Controla qué modal de tabla está abierto: "returnable" | "consumable" | null
    const [materialModal, setMaterialModal] = useState(null);
    // Map donde la clave es el ID del devolutivo y el valor es la cantidad seleccionada
    // Para herramienta sin placa la cantidad es editable; para los demás siempre es 1
    const [selectedReturnableIds, setSelectedReturnableIds] = useState(new Map());
    // Map donde la clave es el ID del consumible (string) y el valor es la cantidad ingresada
    const [selectedConsumables, setSelectedConsumables] = useState(new Map());
    // Datos reales de la API
    const [availableReturnableMaterials, setAvailableReturnableMaterials] = useState([]);
    const [availableConsumableMaterials, setAvailableConsumableMaterials] = useState([]);

    useEffect(() => {
        // Devolutivos: activos y con material_state === null (disponible = no tiene estado de baja)
        getReturnables().then((data) => {
            setAvailableReturnableMaterials(
                data.filter((m) => m.is_active && m.material_quantity_available > 0)
            );
        }).catch(console.error);

        // Consumibles: activos con stock disponible mayor a 0
        getMaterials().then((data) => {
            setAvailableConsumableMaterials(
                data.filter((m) => {
                    const qty = Number(getField(m, "materialQuantity", "material_quantity_available"));
                    return m.is_active && qty > 0;
                })
            );
        }).catch(console.error);
    }, []);

    // Abre el modal pre-cargando los materiales que ya fueron confirmados antes
    const handleOpenMaterialModal = (type) => {
        setMaterialModal(type);
        if (type === "returnable") {
            const preSelected = new Map();
            selectedMaterials
                .filter((m) => m.tipo === returnable_type)
                .forEach((m) => preSelected.set(m.id, m.cantidad));
            setSelectedReturnableIds(preSelected);
        } else {
            const preSelected = new Map();
            selectedMaterials
                .filter((m) => m.tipo === consumable_type)
                .forEach((m) => preSelected.set(String(m.id), m.cantidad));
            setSelectedConsumables(preSelected);
        }
    };

    const handleCloseMaterialModal = () => setMaterialModal(null);

    // Marca/desmarca un devolutivo; al marcar inicializa cantidad en 1
    const toggleReturnable = (id) => {
        setSelectedReturnableIds((prev) => {
            const next = new Map(prev);
            next.has(id) ? next.delete(id) : next.set(id, 1);
            return next;
        });
    };

    // Actualiza la cantidad de un devolutivo herramienta sin placa.
    // Clampea inmediatamente en onChange para que nunca se pueda teclear más del máximo.
    // Permite vacío temporalmente (el blur lo corrige a 1).
    const handleReturnableQtyChange = (id, rawValue) => {
        const digits = rawValue.replace(/\D/g, "");
        if (!digits) {
            // Vacío permitido mientras el usuario borra para reescribir
            setSelectedReturnableIds((prev) => {
                const next = new Map(prev);
                next.set(id, "");
                return next;
            });
            return;
        }
        const item   = availableReturnableMaterials.find((m) => m.id === id);
        const maxQty = item?.material_quantity_available ?? 1;
        const num    = Number(digits);
        const clamped = Math.min(Math.max(1, num), maxQty);
        setSelectedReturnableIds((prev) => {
            const next = new Map(prev);
            next.set(id, clamped);
            return next;
        });
    };

    // Si el usuario sale del input con el campo vacío, se restaura a 1
    const handleReturnableQtyBlur = (id) => {
        setSelectedReturnableIds((prev) => {
            const raw = prev.get(id);
            if (raw !== "" && raw !== undefined) return prev; // ya tiene valor válido, no hacer nada
            const next = new Map(prev);
            next.set(id, 1);
            return next;
        });
    };

    // Al marcar inicializa la cantidad en "" para habilitar el input; al desmarcar elimina la entrada del Map
    const toggleConsumable = (id) => {
        setSelectedConsumables((prev) => {
            const next = new Map(prev);
            if (next.has(String(id))) {
                next.delete(String(id));
            } else {
                next.set(String(id), "");
            }
            return next;
        });
    };

    // Actualiza la cantidad de un consumible ya seleccionado cuando el usuario escribe en el input de la tabla
    const handleConsumableQtyChange = (id, value) => {
        const availableQty = Number(
            getField(
                availableConsumableMaterials.find((m) => String(m.id) === String(id)) ?? {},
                "materialQuantity",
                "material_quantity_available"
            )
        );
        // /\D/g elimina cualquier carácter que no sea dígito
        // Math.min impide ingresar más unidades de las disponibles
        const digits = value.replace(/\D/g, "");
        const clamped = digits === "" ? "" : Math.min(Number(digits), availableQty);
        setSelectedConsumables((prev) => {
            const next = new Map(prev);
            next.set(String(id), clamped);
            return next;
        });
    };

    const handleConfirmReturnables = () => {
        const toAdd = availableReturnableMaterials
            .filter((item) => selectedReturnableIds.has(item.id))
            .map((item) => ({
                id:       item.id,
                name:     getField(item, "materialName", "material_name"),
                placaSena: getField(item, "materialBarcodeSena", "material_barcode_sena") || null,
                serial:   getField(item, "returnableMaterialSerial", "material_serial") || null,
                // Usa la cantidad del Map; para no-herramienta o con placa siempre es 1
                cantidad: selectedReturnableIds.get(item.id) ?? 1,
                tipo:     returnable_type,
            }));

        if (!toAdd.length) return;

        setSelectedMaterials((prev) => {
            const filtered = prev.filter((item) => item.tipo !== returnable_type || !selectedReturnableIds.has(item.id));
            return [...filtered, ...toAdd];
        });
        setMaterialModal(null);
        setSelectedReturnableIds(new Map());
    };

    const handleConfirmConsumables = () => {
        const toAdd = [];

        // Recorre el Map de seleccionados y valida cada entrada antes de agregarla
        for (const [id, cantidad] of selectedConsumables.entries()) {
            const quantity = Number(cantidad);
            // Descarta entradas con cantidad inválida
            if (!Number.isInteger(quantity) || quantity < 1) continue;

            const material = availableConsumableMaterials.find((m) => String(m.id) === String(id));
            // Descarta si el material ya no existe en la lista (caso defensivo)
            if (!material) continue;

            const availableQty = Number(getField(material, "materialQuantity", "material_quantity_available"));
            // Descarta si la cantidad supera el stock actual
            if (quantity > availableQty) continue;

            toAdd.push({
                id: material.id,
                name: getField(material, "materialName", "material_name"),
                placaSena: null,
                serial: null,
                cantidad: quantity,
                tipo: consumable_type,
            });
        }

        if (!toAdd.length) return;

        setSelectedMaterials((prev) => {
            // Quita del estado del padre los consumibles que van a ser reemplazados
            const addedIds = new Set(toAdd.map((i) => i.id));
            const filtered = prev.filter((item) => item.tipo !== consumable_type || !addedIds.has(item.id));
            return [...filtered, ...toAdd];
        });
        setMaterialModal(null);
        setSelectedConsumables(new Map());
    };

    // Columnas para la tabla de devolutivos; cada celda usa DisabledCell para atenuar filas no seleccionadas
    const returnableColumns = [
        {
            accessorKey: "material_name",
            header: "Nombre",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-40">
                    {getField(row.original, "material_name", "materialName")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "material_barcode_sena",
            header: "Placa Sena",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-36 whitespace-nowrap">
                    {getField(row.original, "material_barcode_sena", "materialBarcodeSena") || "—"}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "material_serial",
            header: "Serial",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-36 whitespace-nowrap">
                    {getField(row.original, "material_serial", "returnableMaterialSerial") || "—"}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "material_category",
            header: "Categoría",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-36">
                    {formatCategory(getField(row.original, "material_category", "returnableMaterialCategory"))}
                </DisabledCell>
            ),
        },
        {
            id: "quantity",
            header: "Cantidad",
            cell: ({ row }) => {
                const item       = row.original;
                const isSelected = selectedReturnableIds.has(item.id);
                const category   = getField(item, "material_category", "returnableMaterialCategory");
                const placa      = getField(item, "material_barcode_sena", "materialBarcodeSena");
                const maxQty     = item.material_quantity_available ?? 1;
                // Solo herramienta sin placa puede tener cantidad > 1
                const isEditable = isSelected && category === "herramienta" && !placa;

                if (!isSelected) {
                    return <span className="block min-w-16 text-center text-text-muted opacity-40">—</span>;
                }
                if (!isEditable) {
                    return <span className="block min-w-16 text-center py-3">1</span>;
                }
                return (
                    <div className="flex items-center gap-1 justify-center min-w-20">
                        <div className="w-14">
                            <Input
                                type="text"
                                inputMode="numeric"
                                variant="isEdit"
                                value={selectedReturnableIds.get(item.id) ?? 1}
                                onChange={(e) => handleReturnableQtyChange(item.id, e.target.value)}
                                onBlur={() => handleReturnableQtyBlur(item.id)}
                            />
                        </div>
                        <span className="text-text-muted text-sm whitespace-nowrap">/ {maxQty}</span>
                    </div>
                );
            },
        },
        {
            id: "select",
            header: "Seleccione",
            cell: ({ row }) => {
                const material   = row.original;
                const isSelected = selectedReturnableIds.has(material.id);
                return (
                    <div className="flex justify-center min-w-16">
                        <Checkbox
                            id={`returnable-${material.id}`}
                            name="returnableMaterial"
                            checked={isSelected}
                            onChange={() => toggleReturnable(material.id)}
                        />
                    </div>
                );
            },
        },
    ];

    // Columnas para la tabla de consumibles; usa getField porque los nombres de campo pueden variar
    const consumableColumns = [
        {
            accessorKey: "materialName",
            header: "Nombre",
            cell: ({ row }) => (
                // Se convierte el id a string para que coincida con las claves del Map
                <DisabledCell active={selectedConsumables.has(String(row.original.id))} className="min-w-40">
                    {getField(row.original, "materialName", "material_name")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "brandName",
            header: "Marca",
            cell: ({ row }) => (
                <DisabledCell active={selectedConsumables.has(String(row.original.id))} className="min-w-28">
                    {getField(row.original, "brandName", "brand_name")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "inventoryManager",
            header: "Cuentadante",
            cell: ({ row }) => (
                <DisabledCell active={selectedConsumables.has(String(row.original.id))} className="min-w-48">
                    {getField(row.original, "inventoryManager", "inventory_manager_name")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "materialQuantity",
            header: "Cantidad disponible",
            cell: ({ row }) => (
                <DisabledCell active={selectedConsumables.has(String(row.original.id))} className="min-w-36 pl-16">
                    {getField(row.original, "materialQuantity", "material_quantity_available")}
                </DisabledCell>
            ),
        },
        {
            // id en lugar de accessorKey porque no representa un campo del dato sino una acción
            id: "select",
            header: "Seleccione",
            cell: ({ row }) => {
                const id = String(row.original.id);
                const isSelected = selectedConsumables.has(id);
                return (
                    <div className="flex justify-center min-w-16">
                        <Checkbox
                            id={`consumable-${row.original.id}`}
                            name="consumableMaterial"
                            checked={isSelected}
                            onChange={() => toggleConsumable(row.original.id)}
                        />
                    </div>
                );
            },
        },
        {
            // Columna de cantidad inline: solo se habilita cuando la fila está marcada con el checkbox
            id: "quantity",
            header: "Cantidad",
            cell: ({ row }) => {
                const id = String(row.original.id);
                const isSelected = selectedConsumables.has(id);
                return (
                    <div className="flex justify-center min-w-24">
                        <div className="w-16">
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                variant="isEdit"
                                disabled={!isSelected}
                                value={isSelected ? (selectedConsumables.get(id) ?? "") : ""}
                                onChange={(e) => handleConsumableQtyChange(id, e.target.value)}
                            />
                        </div>
                    </div>
                );
            },
        },
    ];

    // El botón confirmar solo se habilita si hay al menos un devolutivo seleccionado
    // y todas las cantidades son >= 1
    const canConfirmReturnables =
        selectedReturnableIds.size > 0 &&
        [...selectedReturnableIds.values()].every((qty) => Number(qty) >= 1);
    // spread + .values() convierte el iterador del Map a array para poder usar .some()
    const canConfirmConsumables = [...selectedConsumables.values()].some((qty) => Number(qty) >= 1);

    return (
        <>
            {/* Botones que abren el modal correspondiente según el tipo de material */}
            <div className="flex flex-col gap-4">
                <h2 className="font-bold text-body">1. Selecciona los materiales</h2>
                <div className="flex gap-3 justify-center">
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenMaterialModal("returnable")}
                    >
                        Devolutivo
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenMaterialModal("consumable")}
                    >
                        Consumible
                    </Button>
                </div>
            </div>

            {/* Modal de tabla para devolutivos; solo se monta cuando materialModal === "returnable" */}
            <MaterialModal
                title="Seleccionar material devolutivo"
                isOpen={materialModal === "returnable"}
                onClose={handleCloseMaterialModal}
            >
                <div className="overflow-y-auto">
                    <DataTable data={availableReturnableMaterials} columns={returnableColumns} />
                </div>

                <div className="mt-4 pt-4 border-t border-brand flex justify-end">
                    <IconButton
                        disabled={!canConfirmReturnables}
                        onClick={handleConfirmReturnables}
                    >
                        Confirmar
                    </IconButton>
                </div>
            </MaterialModal>

            {/* Modal de tabla para consumibles; solo se monta cuando materialModal === "consumable" */}
            <MaterialModal
                title="Seleccionar material de consumo"
                isOpen={materialModal === "consumable"}
                onClose={handleCloseMaterialModal}
            >
                <div className="overflow-y-auto">
                    <DataTable data={availableConsumableMaterials} columns={consumableColumns} />
                </div>

                <div className="mt-4 pt-4 gap-3 border-t border-brand flex justify-end">
                    <IconButton
                        variant="outline"
                        disabled={!canConfirmConsumables}
                        onClick={handleConfirmConsumables}
                    >
                        Confirmar
                    </IconButton>
                </div>
            </MaterialModal>
        </>
    );
}
