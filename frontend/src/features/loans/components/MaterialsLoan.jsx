import { useState } from "react";
import { Button, Checkbox, Input } from "@/shared";
import DataTable from "@/shared/components/DataTable";
import { materials } from "@/features/consumable-material/data/materials";
import { returnableMaterial } from "@/features/returnable-material/data/retrunableMaterial";

const available = "Disponible";
const returnable_type = "Devolutivo";
const consumable_type = "Consumo";

// Algunos datos mock usan camelCase y otros snake_case.
// Esta ayuda mantiene el componente preparado para ambas formas sin duplicar lecturas.
const getField = (item, ...keys) => {
    const key = keys.find((currentKey) => item[currentKey] !== undefined);
    return key ? item[key] : "";
};

function MaterialModal({ title, isOpen, onClose, children, compact = false }) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
            <div
                className={`w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-5 shadow-2xl ${compact ? "max-w-136" : "max-w-5xl"}`}
            >
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                    >
                        Atrás
                    </Button>
                    {title && <h2 className="text-gradient-title text-h3 font-bold">{title}</h2>}
                </div>
                {children}
            </div>
        </div>
    );
}

function DisabledCell({ active, children, className = "" }) {
    
    // Muestra la fila donde si está activo usa color principal, si no, aparece atenuado
    return (
        <span className={`block py-3 ${active ? "text-text-primary" : "text-text-muted opacity-55"} ${className}`}>
            {children}
        </span>
    );
}

export default function MaterialsLoan({ setSelectedMaterials }) {
    // null significa que no hay modal de tabla abierto
    const [materialModal, setMaterialModal] = useState(null);
    const [selectedReturnableId, setSelectedReturnableId] = useState("");
    const [selectedConsumableId, setSelectedConsumableId] = useState("");
    // Empieza en false porque la cantidad solo se pide despues de elegir un consumible.
    const [quantityModalOpen, setQuantityModalOpen] = useState(false);
    const [consumableQuantity, setConsumableQuantity] = useState("");

    const availableReturnableMaterials = returnableMaterial.filter((material) =>
        material.is_active && material.materialState === available
    );

    const availableConsumableMaterials = materials.filter((material) => {
        const availableQuantity = Number(getField(
            material,
            "materialQuantity",
            "material_quantity_available"
        ));

        return material.is_active && availableQuantity > 0;
    });

    // Encuentra el material consumible que coincide con el id seleccionado
    const selectedConsumableMaterial = availableConsumableMaterials.find(
        (material) => String(material.id) === String(selectedConsumableId)
    );

    // Abre el modal de materiales del tipo indicado y limpia las selecciones anteriores
    const handleOpenMaterialModal = (type) => {
        setMaterialModal(type);
        setSelectedReturnableId("");
        setSelectedConsumableId("");
    };

    const handleCloseMaterialModal = () => {
        setMaterialModal(null);
    };

    const handleCloseQuantityModal = () => {
        setQuantityModalOpen(false);
    };
    // Agrega un material retornable a la lista de materiales seleccionados
    const handleAddReturnable = () => {

        // Busca el material seleccionado dentro de los materiales disponibles
        const material = availableReturnableMaterials.find(
            (item) => String(item.id) === String(selectedReturnableId)
        );

        // Valida que el material exista antes de continuar
        if (!material) return;

        // Actualiza la lista eliminando duplicados y agregando el material seleccionado
        setSelectedMaterials((prev) => [
            ...prev.filter((item) => item.id !== material.id || item.tipo !== returnable_type),
            {
                id: material.id,
                name: material.materialName,
                placaSena: material.materialBarcodeSena,
                serial: material.returnableMaterialSerial,
                cantidad: 1,
                tipo: returnable_type,
            },
        ]);

        // Cierra el modal y limpia la selección actual
        setMaterialModal(null);
        setSelectedReturnableId("");
    };


    const handleOpenQuantityModal = () => {
        if (!selectedConsumableMaterial) return;

        setConsumableQuantity("");
        setQuantityModalOpen(true);
    };
    // Actualiza la cantidad, permitiendo solo digitos, elimina cualquier carácter no numerico
    const handleQuantityChange = (event) => {
        setConsumableQuantity(event.target.value.replace(/\D/g, ""));
    };

    const handleAddConsumable = () => {
         // Convierte la cantidad ingresada y el stock disponible del material seleccionado a numero
        const quantity = Number(consumableQuantity);
        const availableQuantity = Number(getField(
            selectedConsumableMaterial ?? {},
            "materialQuantity",
            "material_quantity_available"
        ));
         // Valida que haya un material seleccionado y que la cantidad sea un entero entre 1 y el stock disponible
        const quantityIsValid =
            selectedConsumableMaterial &&
            Number.isInteger(quantity) &&
            quantity >= 1 &&
            quantity <= availableQuantity;

        // Si la validación falla, no hace nada
        if (!quantityIsValid) return;

        // Agregamos el consumible a la lista, si ya existía (el mismo id y tipo), se reemplaza
        setSelectedMaterials((prev) => [
            ...prev.filter((item) => item.id !== selectedConsumableMaterial.id || item.tipo !== consumable_type),
            {
                id: selectedConsumableMaterial.id,
                name: getField(selectedConsumableMaterial, "materialName", "material_name"),
                placaSena: null,
                serial: null,
                cantidad: quantity,
                tipo: consumable_type,
            },
        ]);
        setQuantityModalOpen(false);
        setMaterialModal(null);
        setSelectedConsumableId("");
        setConsumableQuantity("");
    };

    const returnableColumns = [
        {
            accessorKey: "materialName",
            header: "Nombre",
            // Muestra el nombre del material con un checkbox para seleccionarlo o deseleccionarlo
            cell: ({ row }) => {
                const material = row.original;
                const isSelected = String(selectedReturnableId) === String(material.id);

                return (
                    <div className="min-w-40">
                        <Checkbox
                            id={`returnable-${material.id}`}
                            name="returnableMaterial"
                            label={<span className="text-body">{material.materialName}</span>}
                            checked={isSelected}
                            onChange={() => setSelectedReturnableId(isSelected ? "" : material.id)}
                        />
                    </div>
                );
            },
        },
        // Las siguientes columnas (Placa Sena, Serial, Categoria y Estado) siguen el mismo patron,
        // muestran el valor del campo correspondiente y se activan visualmente cuando la fila esta seleccionada
        {
            accessorKey: "materialBarcodeSena",
            header: "Placa Sena",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedReturnableId) === String(row.original.id)} className="min-w-36 whitespace-nowrap">
                    {row.original.materialBarcodeSena}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "returnableMaterialSerial",
            header: "Serial",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedReturnableId) === String(row.original.id)} className="min-w-36 whitespace-nowrap">
                    {row.original.returnableMaterialSerial}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "returnableMaterialCategory",
            header: "Categoria",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedReturnableId) === String(row.original.id)} className="min-w-36">
                    {row.original.returnableMaterialCategory}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "materialState",
            header: "Estado",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedReturnableId) === String(row.original.id)} className="min-w-28 text-success">
                    {row.original.materialState}
                </DisabledCell>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => (
                <Button
                    type="button"
                    variant="primary"
                    showIcon={false}
                    size="sm"
                    disabled={String(selectedReturnableId) !== String(row.original.id)}
                    onClick={handleAddReturnable}
                >
                   Agregar
                </Button>
            ),
        },
    ];

    const consumableColumns = [
        {
            accessorKey: "materialName",
            header: "Nombre",
            cell: ({ row }) => {
                const material = row.original;
                const isSelected = String(selectedConsumableId) === String(material.id);

                return (
                    <div className="min-w-40">
                        <Checkbox
                            id={`consumable-${material.id}`}
                            name="materials"
                            label={<span className="text-body">{getField(material, "materialName", "material_name")}</span>}
                            checked={isSelected}
                            onChange={() => setSelectedConsumableId(isSelected ? "" : material.id)}
                        />
                    </div>
                );
            },
        },
        {
            accessorKey: "brandName",
            header: "Marca",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedConsumableId) === String(row.original.id)} className="min-w-28">
                    {getField(row.original, "brandName", "brand_name")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "inventoryManager",
            header: "Cuentadante",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedConsumableId) === String(row.original.id)} className="min-w-48">
                    {getField(row.original, "inventoryManager", "inventory_manager_name")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "materialQuantity",
            header: "Cantidad",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedConsumableId) === String(row.original.id)} className="min-w-36">
                    {getField(row.original, "materialQuantity", "material_quantity_available")}
                </DisabledCell>
            ),
        },
        {
            accessorKey: "materialLocation",
            header: "Ubicacion",
            cell: ({ row }) => (
                <DisabledCell active={String(selectedConsumableId) === String(row.original.id)} className="min-w-36">
                    {getField(row.original, "materialLocation", "material_location")}
                </DisabledCell>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => (
                <Button
                    type="button"
                    variant="primary"
                    showIcon={false}
                    size="sm"
                    disabled={String(selectedConsumableId) !== String(row.original.id)}
                    onClick={handleOpenQuantityModal}
                >
                    Agregar
                </Button>
            ),
        },
    ];

    return (
        <>
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

            <MaterialModal
                title="Seleccionar material devolutivo"
                isOpen={materialModal === "returnable"}
                onClose={handleCloseMaterialModal}
            >
                <DataTable data={availableReturnableMaterials} columns={returnableColumns} />
            </MaterialModal>

            <MaterialModal
                title="Seleccionar material de consumo"
                isOpen={materialModal === "consumable"}
                onClose={handleCloseMaterialModal}
            >
                <DataTable data={availableConsumableMaterials} columns={consumableColumns} />
            </MaterialModal>

            <MaterialModal
                isOpen={quantityModalOpen}
                onClose={handleCloseQuantityModal}
                compact
            >
                <div className="flex flex-col gap-4">
                    <h2 className="text-h3 font-bold">
                        Cantidad de material de consumo
                    </h2>
                    <p className="text-body text-text-primary">
                        Digita la cantidad a prestar de {selectedConsumableMaterial?.materialName}.
                        Disponible: {selectedConsumableMaterial?.materialQuantity ?? 0}.
                    </p>
                    <Input
                        label="Cantidad"
                        type="text"
                        placeholder="Cantidad"
                        className="max-w-72 mx-auto"
                        value={consumableQuantity}
                        onChange={handleQuantityChange}
                    />
                    <div className="flex justify-center gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleCloseQuantityModal}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            showIcon={false}
                            onClick={handleAddConsumable}
                        >
                            Agregar
                        </Button>
                    </div>
                </div>
            </MaterialModal>
        </>
    );
}
