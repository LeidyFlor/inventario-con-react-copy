import { useState, useEffect } from "react";
import { QuotationPickerModal } from "@/features/quotations";
import { ViewPageTemplate, ViewDetailCard, Alert, Button, TechnicalFilesModal } from "@/shared/";
import { Router, FileText, FileStack } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getReturnables } from "../services/returnableService";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM, SCREEN_PERMS } from "@/features/permissions/config/perms";

const MATERIAL_TYPE_LABELS = {
    herramienta:       "Herramienta",
    maquinaria_equipos:"Maquinaria y equipos",
    muebles_enseres:   "Muebles y enseres",
};

const STATE_LABELS = {
    no_disponible: "No disponible",
    prestado:      "Prestado",
    traslado:      "Traslado",
    baja:          "Baja",
};

const formatPrice = (value) =>
    value != null ? `$${Number(value).toLocaleString("es-CO")}` : "—";

// Las fechas llegan como "YYYY-MM-DD". Se parten a mano en vez de usar
// new Date(), que las interpreta en UTC y en Colombia muestra el día anterior.
const formatDate = (value) => {
    if (!value) return "—";
    const [anio, mes, dia] = String(value).split("-");
    return `${dia}/${mes}/${anio}`;
};

export default function ViewReturnablePage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPerm, hasAllPerms } = usePermissions();

    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    // Las fichas técnicas se consultan desde aquí en modo solo lectura, para
    // que también las pueda ver quien no tiene permiso de edición
    const [showFilesModal, setShowFilesModal] = useState(false);
    const [showQuotations, setShowQuotations] = useState(false);

    useEffect(() => {
        getReturnables()
            .then(all => {
                const found = all.find(m => String(m.id) === String(id));
                if (!found) throw new Error("no encontrado");
                setMaterial(found);
            })
            .catch(() => Alert.error("Error", "No se pudo cargar el material"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando material...</p>
        </div>
    );

    if (!material) return <p>Material devolutivo no encontrado</p>;

    return (
        <>
        <ViewPageTemplate
            title="Visualizar material devolutivo"
            icon={<Router className="text-brand" />}
            image={material.material_image}
            name={material.material_name}
            description={material.material_description}
            estado={material.is_active}
            onEdit={hasAllPerms(SCREEN_PERMS.RETURNABLE_EDIT)
                ? () => navigate(`/dashboard/returnable-materials/${material.id}/edit`)
                : undefined}
            topActions={<div className="flex gap-2">
                {/* Los mismos botones del formulario de edición, pero abren los
                    modales en modo consulta. Sin hasPerm: ver la ficha técnica
                    o las cotizaciones no debería exigir permiso de edición. */}
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowFilesModal(true)}>
                    <FileText size={18} />
                    Fichas
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowQuotations(true)}>
                    <FileStack size={18} />
                    Cotizaciones
                </Button>
            </div>}
        >
            <ViewDetailCard fields={[
                { label: "Placa SENA",          value: material.material_barcode_sena ?? "—" },
                { label: "Tipo de material",           value: MATERIAL_TYPE_LABELS[material.material_type] ?? material.material_type },
                // Inventario y categoría se administran desde Configuración
                { label: "Nombre de inventario", value: material.inventory_name_display || "—" },
                { label: "Categoría",           value: material.category_display || "—" },
                // Marca y modelo son opcionales, por eso el guion cuando faltan
                { label: "Marca",               value: material.brand_name || "—" },
                { label: "Modelo",              value: material.material_model || "—" },
                { label: "S/N",                 value: material.material_serial || "—" },
                { label: "Cuentadante",         value: material.inventory_manager_name },
                { label: "Cantidad",            value: material.material_quantity },
                { label: "Cantidad disponible", value: material.material_quantity_available },
                { label: "Valor unitario",      value: formatPrice(material.material_unit_price) },
                { label: "Valor total",         value: formatPrice(material.material_total_price) },
                { label: "Fecha de compra",     value: formatDate(material.material_purchase_date) },
                { label: "Fecha de ingreso",    value: formatDate(material.material_entry_date) },
                { label: "Ubicación",           value: material.material_location || "—" },
                { label: "Dimensiones",         value: material.material_dimensions || "—" },
                { label: "Estado",              value: material.is_active ? "Disponible" : (STATE_LABELS[material.material_state] ?? material.material_state) },
            ]} />
        </ViewPageTemplate>

        {/* Modo solo lectura: se ven las fichas y se pueden abrir, pero no
            subir ni eliminar. Por eso los setters van vacíos. */}
        <TechnicalFilesModal
            readOnly
            isOpen={showFilesModal}
            onClose={() => setShowFilesModal(false)}
            existingFiles={material.technical_files ?? []}
            setExistingFiles={() => {}}
            newTechFiles={[]}
            setNewTechFiles={() => {}}
            setRemovedFileIds={() => {}}
        />

        {/* Solo lectura: se listan las cotizaciones del material y se pueden
            abrir en otra pestaña, pero no cambiar. Eso se hace en editar. */}
        {showQuotations && (
            <QuotationPickerModal
                readOnly
                quotations={material.quotations ?? []}
                onClose={() => setShowQuotations(false)}
            />
        )}
        </>
    );
}
