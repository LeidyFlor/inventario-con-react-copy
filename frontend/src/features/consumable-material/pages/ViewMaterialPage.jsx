import { useState, useEffect } from "react";
import { ViewPageTemplate, ViewDetailCard } from "@/shared/";
import { Cable } from "lucide-react";
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

export default function ViewMaterialPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPerm } = usePermissions();

    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);

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
        >
            <ViewDetailCard fields={[
                { label: "Placa sena",          value: material.material_barcode_sena ?? "—" },
                { label: "Marca",               value: material.brand_name },
                { label: "Cuentadante",         value: material.inventory_manager_name },
                { label: "Cantidad total",      value: material.material_quantity },
                { label: "Cantidad prestada",   value: material.material_quantity_loaned },
                { label: "Cantidad disponible", value: material.material_quantity_available },
                { label: "Valor unitario",      value: formatPrice(material.material_unit_price) },
                { label: "Valor total",         value: formatPrice(material.material_total_price) },
                { label: "Ubicación",           value: material.material_location || "—" },
                { label: "Estado",              value: material.is_active ? "Disponible" : (STATE_LABELS[material.material_state] ?? material.material_state) },
            ]} />
        </ViewPageTemplate>
    );
}
