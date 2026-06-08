import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { Cable } from "lucide-react";
import { materials } from "../data/materials";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewMaterialPage(){
    const navigate = useNavigate();
    const { id } = useParams(); // 👈 obtiene el id de la URL. usa String

    const material = materials.find(u => u.id === Number(id)); // 👈 busca el usuario, se convierte string a nummero, useParas siempre devulve string

    if (!material) return <p>Material no encontrado</p>;

    const handleEdit = () => {
        navigate(`/dashboard/materials/${material.id}/edit`);
    };
    //Convierte fecha de formato ISO a fecha legible
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return(

            <ViewPageTemplate
                title="Visualizar material de consumo"
                icon={<Cable className="text-brand"/>}
                image={material.foto}
                name={material.materialName}
                description={material.materialDescription}
                estado={material.is_active}
                // onToggleEstado={() => handleToggle()}
                onEdit={handleEdit}
            >
                
                
                <ViewDetailCard fields={[
                    { label: "Placa sena", value: material.materialBarcodeSena },
                    { label: "Nombre del elemento", value: material.materialName },
                    { label: "Marca", value: formatDate(material.brandName) },
                    { label: "Modelo", value: formatDate(material.materialBarcodeSena ) },
                    { label: "Cuentadante", value: material.inventoryManger },
                    { label: "Cantidad", value: material.materialQuantity },
                    { label: "Valor unitario", value: material. materialUnitPrice },
                    { label: "Valor total", value: material.materialTotalPrice },
                    { label: "Ubicación", value: material.materialLocation },
                    { label: "Estado", value: material.materialState },
                ]} />
            </ViewPageTemplate>
    )
}