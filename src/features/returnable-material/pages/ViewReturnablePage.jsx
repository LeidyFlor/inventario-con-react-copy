import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { Router } from "lucide-react";
import { returnableMaterial } from "../data/retrunableMaterial";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewReturnablePage() {
    const navigate = useNavigate();
    const { id } = useParams(); // 👈 obtiene el id de la URL. usa String

    const returnable = returnableMaterial.find(m => m.id === Number(id)); // 👈 busca el material, se convierte string a nummero, useParas siempre devulve string

    if (!returnable) return <p>Material devolutivo no encontrado</p>;

    const handleEdit = () => {
        navigate(`/dashboard/returnable-materials/${returnable.id}/edit`);
    };
    //Convierte fecha de formato ISO a fecha legible
    // const formatDate = (dateString) => {
    //     if (!dateString) return "-";
    //     return new Date(dateString).toLocaleDateString("es-CO", {
    //         day: "2-digit",
    //         month: "2-digit",
    //         year: "numeric"
    //     });
    // };
    const formatMoney = (price) => {
        if (!price) return "-";
        return `$ ${price.toLocaleString()}`
    }

    return (

        <ViewPageTemplate
            title="Perfil de usuario"
            icon={<Router className="text-brand" />}
            image={returnable.foto}
            name={returnable.materialName}
            estado={returnable.is_active}
            // onToggleEstado={() => handleToggle()}
            onEdit={handleEdit}
            description={returnable.materialDescription}
        >
            <ViewDetailCard fields={[
                { label: "Placa Sena", value: returnable.materialBarcodeSena },
                { label: "Categoría", value: returnable.returnableMaterialCategory },
                { label: "Marca", value: returnable.brandName },
                { label: "Modelo", value: returnable.returnableMaterialModel },
                { label: "Serial", value: returnable.returnableMaterialSerial },
                { label: "Cuentadante", value: returnable.inventoryManger },
                { label: "Cantidad", value: returnable.materialQuantity },
                { label: "Valor unitario", value: formatMoney(returnable.materialUnitPrice) },
                { label: "Valor total", value: formatMoney(returnable.materialTotalPrice) },
                { label: "Estado", value: returnable.materialState },
                { label: "Localización", value: returnable.materialLocation },
                { label: "Dimensiones", value: returnable.returnableMaterialDimensions },
            ]} />
        </ViewPageTemplate>
    )
}