import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { UserRound } from "lucide-react";
import { users } from "../data/users";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewUserPage(){
    const navigate = useNavigate();
    const { id } = useParams(); // 👈 obtiene el id de la URL. usa String

    const user = users.find(u => u.id === Number(id)); // 👈 busca el usuario, se convierte string a nummero, useParas siempre devulve string

    if (!user) return <p>Usuario no encontrado</p>;

    const handleEdit = () => {
        navigate(`/dashboard/users/${user.id}/edit`);
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
                title="Perfil de usuario"
                icon={<UserRound className="text-brand"/>}
                image={user.foto}
                name={user.userName}
                estado={user.is_active}
                // onToggleEstado={() => handleToggle()}
                onEdit={handleEdit}
                topActions={
                    <div className="flex gap-4">
                        <Button variant="primary" size="sm">Agregar tarea</Button>
                        <Button variant="ghost" size="sm">Ver tarea</Button>
                    </div>
                }
            >
                <ViewDetailCard fields={[
                    { label: "Tipo de documento", value: user.userDocumentType },
                    { label: "Número de documento", value: user.userDocument },
                    { label: "Tipo de usuario", value: user.userType },
                    { label: "Fecha inicio", value: formatDate(user.userDateStart) },
                    { label: "Fecha fin", value: formatDate(user.userDateEnd) },
                    { label: "Correo electrónico", value: user.userEmail },
                    { label: "Número telefónico", value: user.userTel },
                    { label: "Dirección", value: user.userAddres },
                    { label: "Segundo teléfono", value: user.userTel2 },
                    { label: "Correo institucional", value: user.userEmail2 },
                ]} />
            </ViewPageTemplate>
    )
}