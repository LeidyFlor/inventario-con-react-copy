import { useState, useEffect } from "react";
import { ViewPageTemplate, ViewDetailCard, Button, TechnicalFilesModal } from "@/shared/";
import { Cable, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getMaterial } from "../services/materialService";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import { Alert } from "@/shared";
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM } from "@/features/permissions/config/perms";

const STATE_LABELS = {
    no_disponible: "No disponible",
    prestado: "Prestado",
    traslado: "Traslado",
    baja: "Baja",
};

const formatPrice = (value) =>
    value != null
        ? `$${Number(value).toLocaleString("es-CO")}`
        : "—";

// Las fechas llegan como "YYYY-MM-DD". Se parten a mano en vez de usar
// new Date(), que las interpreta en UTC y en Colombia muestra el día anterior.
const formatDate = (value) => {
    if (!value) return "—";
    const [anio, mes, dia] = String(value).split("-");
    return `${dia}/${mes}/${anio}`;
};

export default function ViewMaterialPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPerm } = usePermissions();

    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    // Las fichas técnicas se consultan desde aquí en modo solo lectura, para
    // que también las pueda ver quien no tiene permiso de edición
    const [showFilesModal, setShowFilesModal] = useState(false);

    useEffect(() => {
        getMaterial(id)
            .then(setMaterial)
            .catch(() => Alert.error("Error", "No se pudo cargar el material"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando material...</p>
        </div>
    );

    if (!material) return <p>Material no encontrado</p>;

    return (
        <>
        <ViewPageTemplate
            title="Visualizar material de consumo"
            icon={<Cable className="text-brand" />}
            image={material.material_image}
            name={material.material_name}
            description={material.material_description}
            estado={material.is_active}
            onEdit={hasPerm(PERM.CONSUMABLE_CHANGE)
                ? () => navigate(`/dashboard/consumable-materials/${material.id}/edit`)
                : undefined}
            topActions={
                // Mismo botón que en el formulario de edición, pero abre el
                // modal en modo consulta. Sin hasPerm: ver la ficha técnica no
                // debería exigir permiso de edición.
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowFilesModal(true)}>
                    <FileText size={18} />
                    Fichas
                </Button>
            }
        >
            <ViewDetailCard fields={[
                { label: "Placa sena",          value: material.material_barcode_sena ?? "—" },
                // Inventario y categoría se administran desde Configuración
                { label: "Nombre de inventario", value: material.inventory_name_display || "—" },
                { label: "Categoría",           value: material.category_display || "—" },
                // Marca y modelo son opcionales, por eso el guion cuando faltan
                { label: "Marca",               value: material.brand_name || "—" },
                { label: "Modelo",              value: material.material_model || "—" },
                { label: "S/N",                 value: material.material_serial || "—" },
                { label: "Cuentadante",         value: material.inventory_manager_name },
                { label: "Cantidad total",      value: material.material_quantity },
                { label: "Cantidad prestada",   value: material.material_quantity_loaned },
                { label: "Cantidad disponible", value: material.material_quantity_available },
                { label: "Valor unitario",      value: formatPrice(material.material_unit_price) },
                { label: "Valor total",         value: formatPrice(material.material_total_price) },
                { label: "Fecha de compra",     value: formatDate(material.material_purchase_date) },
                { label: "Fecha de ingreso",    value: formatDate(material.material_entry_date) },
                { label: "Ubicación",           value: material.material_location || "—" },
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
        </>
    );
}
