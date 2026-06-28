import { useState } from "react";
import { Button, Checkbox, IconButton } from "@/shared";
import DataTable from "@/shared/components/DataTable";
import { materials } from "@/features/consumable-material/data/materials";
import { returnableMaterial } from "@/features/returnable-material/data/retrunableMaterial";
import { ArrowLeft, CheckCheck } from "lucide-react";

// Constantes para evitar escribir estos strings directamente en la lógica
const available = "Disponible";
const returnable_type = "Devolutivo";
const consumable_type = "Consumo";

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
export default function MaterialsLoan({ setSelectedMaterials }) {
    // Controla qué modal de tabla está abierto: "returnable" | "consumable" | null
    const [materialModal, setMaterialModal] = useState(null);
    // Set con los IDs de devolutivos marcados; se usa Set para que .has() sea eficiente
    const [selectedReturnableIds, setSelectedReturnableIds] = useState(new Set());
    // Map donde la clave es el ID del consumible (string) y el valor es la cantidad ingresada
    const [selectedConsumables, setSelectedConsumables] = useState(new Map());

    // Solo devolutivos activos y en estado "Disponible"
    const availableReturnableMaterials = returnableMaterial.filter((material) =>
        material.is_active && material.materialState === available
    );

    // Solo consumibles activos con cantidad disponible mayor a 0
    const availableConsumableMaterials = materials.filter((material) => {
        const availableQuantity = Number(getField(material, "materialQuantity", "material_quantity_available"));
        return material.is_active && availableQuantity > 0;
    });

    // Abre el modal del tipo indicado y limpia las selecciones anteriores
    const handleOpenMaterialModal = (type) => {
        setMaterialModal(type);
        setSelectedReturnableIds(new Set());
        setSelectedConsumables(new Map());
    };

    const handleCloseMaterialModal = () => setMaterialModal(null);

    // Agrega el ID al Set si no estaba, lo quita si ya estaba (toggle)
    const toggleReturnable = (id) => {
        setSelectedReturnableIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
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
        // Construye el array de devolutivos seleccionados con el formato estándar del préstamo
        const toAdd = availableReturnableMaterials
            .filter((item) => selectedReturnableIds.has(item.id))
            .map((item) => ({
                id: item.id,
                name: item.materialName,
                placaSena: item.materialBarcodeSena,
                serial: item.returnableMaterialSerial,
                cantidad: 1,
                tipo: returnable_type,
            }));

        if (!toAdd.length) return;

        setSelectedMaterials((prev) => {
            // Quita del estado del padre los devolutivos que ya existían con el mismo ID para no duplicarlos
            const filtered = prev.filter((item) => item.tipo !== returnable_type || !selectedReturnableIds.has(item.id));
            return [...filtered, ...toAdd];
        });
        setMaterialModal(null);
        setSelectedReturnableIds(new Set());
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
            accessorKey: "materialName",
            header: "Nombre",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-40">
                    {row.original.materialName}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "materialBarcodeSena",
            header: "Placa Sena",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-36 whitespace-nowrap">
                    {row.original.materialBarcodeSena}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "returnableMaterialSerial",
            header: "Serial",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-36 whitespace-nowrap">
                    {row.original.returnableMaterialSerial}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "returnableMaterialCategory",
            header: "Categoria",
            cell: ({ row }) => (
                <DisabledCell active={selectedReturnableIds.has(row.original.id)} className="min-w-36">
                    {row.original.returnableMaterialCategory}
                </DisabledCell>
            ),
        },
        {
            // id en lugar de accessorKey porque esta columna no representa un campo del dato sino una acción
            id: "select",
            header: "Seleccione",
            cell: ({ row }) => {
                const material = row.original;
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
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            // Si la fila no está seleccionada el input se deshabilita y queda vacío
                            disabled={!isSelected}
                            value={isSelected ? (selectedConsumables.get(id) ?? "") : ""}
                            onChange={(e) => handleConsumableQtyChange(id, e.target.value)}
                            className={`w-16 rounded-lg border px-2 py-1 text-center text-body
                                ${isSelected
                                    ? "border-border text-text-primary"
                                    : "border-border text-text-muted opacity-40 cursor-not-allowed"
                                }`}
                        />
                    </div>
                );
            },
        },
    ];

    // El botón confirmar solo se habilita si hay al menos un elemento seleccionado con cantidad válida
    const canConfirmReturnables = selectedReturnableIds.size > 0;
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
                        size="md"
                        onClick={() => handleOpenMaterialModal("returnable")}
                    >
                        Devolutivo
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
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
