import { useState, useEffect } from "react";
import { ViewPageTemplate, ViewDetailCard, Alert } from "@/shared/";
import { Router } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getReturnables } from "../services/returnableService";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";

const CATEGORY_LABELS = {
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

export default function ViewReturnablePage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);

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
        <ViewPageTemplate
            title="Visualizar material devolutivo"
            icon={<Router className="text-brand" />}
            image={material.material_image}
            name={material.material_name}
            description={material.material_description}
            estado={material.is_active}
            onEdit={() => navigate(`/dashboard/returnable-materials/${material.id}/edit`)}
        >
            <ViewDetailCard fields={[
                { label: "Placa SENA",          value: material.material_barcode_sena ?? "—" },
                { label: "Categoría",           value: CATEGORY_LABELS[material.material_category] ?? material.material_category },
                { label: "Marca",               value: material.brand_name },
                { label: "Modelo",              value: material.material_model },
                { label: "Serial",              value: material.material_serial },
                { label: "Cuentadante",         value: material.inventory_manager_name },
                { label: "Cantidad",            value: material.material_quantity },
                { label: "Cantidad disponible", value: material.material_quantity_available },
                { label: "Valor unitario",      value: formatPrice(material.material_unit_price) },
                { label: "Valor total",         value: formatPrice(material.material_total_price) },
                { label: "Ubicación",           value: material.material_location || "—" },
                { label: "Dimensiones",         value: material.material_dimensions || "—" },
                { label: "Estado",              value: material.is_active ? "Disponible" : (STATE_LABELS[material.material_state] ?? material.material_state) },
            ]} />
        </ViewPageTemplate>
    );
}
