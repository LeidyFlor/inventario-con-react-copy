import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Ping } from 'ldrs/react'
import 'ldrs/react/Ping.css'
import { KeyRound, ListTodo } from "lucide-react";
import ChangePasswordModal from "../components/ChangePasswordModal";

export default function ViewUserPage(){
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        fetch(`/api/users/${id}/`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => { setUser(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando usuarios</p>
        </div>
    );

    if (!user) return <p>Usuario no encontrado</p>;

    const handleEdit = () => {
        navigate(`/dashboard/users/${user.id}/edit`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return(
        <>
            <ViewPageTemplate
                title="Perfil de usuario"
                icon={<UserRound className="text-brand"/>}
                image={user.user_image}
                name={`${user.first_name} ${user.last_name}`}
                estado={user.is_active}
                onEdit={handleEdit}
                topActions={
                    <div className="flex gap-4">
                        <Button variant="primary" size="sm"><p className="hidden md:block">Agregar tarea</p></Button>
                        <Button variant="ghost" size="sm"><ListTodo size={16} /><p className="hidden md:block">Tareas</p></Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            <KeyRound size={20} /><p className="hidden md:block">Cambiar contraseña</p>
                        </Button>
                    </div>
                }
            >
                <ViewDetailCard fields={[
                    { label: "Tipo de documento", value: user.user_document_type },
                    { label: "Número documento", value: user.user_document },
                    { label: "Grupo", value: user.groups?.map(g => g.name).join(", ") },
                    { label: "Fecha inicio", value: formatDate(user.user_date_start) },
                    { label: "Fecha fin", value: formatDate(user.user_date_end) },
                    { label: "Correo electrónico", value: user.email },
                    { label: "Número telefónico", value: user.user_tel },
                    { label: "Dirección", value: user.user_addres },
                    { label: "Segundo teléfono", value: user.user_tel2 },
                    { label: "Correo institucional", value: user.user_email2 },
                ]} />
            </ViewPageTemplate>

            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
        </>
    )
}
