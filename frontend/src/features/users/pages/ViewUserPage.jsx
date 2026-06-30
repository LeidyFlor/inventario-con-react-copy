import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Ping } from 'ldrs/react'
import 'ldrs/react/Ping.css'
import TaskCreateModal from "../components/TaskCreateModal";
import TaskViewModal from "../components/TaskViewModal";

// Import temporal solo para previsualizar TaskViewModal con datos de ejemplo,
// mientras el backend no devuelva las tareas del usuario en /api/users/:id/
import { tasks } from "../../tasks/data/tasks";

export default function ViewUserPage(){
    const navigate = useNavigate();
    const { id } = useParams(); // 👈 obtiene el id de la URL. usa String
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Modal para agregar tarea al vuelo, mismo patrón que en UserRegisterForm
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    // Modal para ver las tareas asignadas al usuario
    const [viewTaskModalOpen, setViewTaskModalOpen] = useState(false);

    // Backend - descomentar cuando se conecte con la api:
    // useEffect(() => {
    //     const token = sessionStorage.getItem("token");
    //     fetch(`/api/users/${id}/`, {
    //         headers: { "Authorization": `Bearer ${token}` }
    //     })
    //         .then(res => res.json())
    //         .then(data => { setUser(data); setLoading(false); })
    //         .catch(() => setLoading(false));
    // }, [id]);

    // Temporal - usuario de prueba en memoria, solo para previsualizar la página
    // sin necesidad de levantar el backend. Quitar junto con el import de arriba
    // al momento de hacer el fetch
    useEffect(() => {
        setUser({
            id,
            first_name: "Juan Camilo",
            last_name: "Castro",
            user_document_type: "CC",
            user_document: "1018439201",
            groups: [{ name: "Administrador" }],
            user_date_start: "2026-01-06",
            user_date_end: "2026-12-23",
            email: "juanca.castro@outlook.com",
            user_tel: "3148902345",
            user_addres: "Calle 44 #22-10, Manizales",
            user_tel2: "",
            user_email2: "",
            is_active: true,
            user_image: "",
        });
        setLoading(false);
    }, [id]);
    if (loading) return (
            <div className="flex flex-col place-items-center gap-2">
                <Ping
                    size="45"
                    speed="1.5"
                    color="#56B526"
                />
                <p className="text-text-muted text-center">Cargando usuarios</p>

            </div>
        );

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
            // se deben colocar los nombres de los campos del backend
            <ViewPageTemplate
                title="Perfil de usuario"
                icon={<UserRound className="text-brand"/>}
                image={user.user_image}
                name={`${user.first_name} ${user.last_name}`}
                estado={user.is_active}
                // onToggleEstado={() => handleToggle()}
                onEdit={handleEdit}
                topActions={
                    <div className="flex gap-4">
                        <Button variant="primary" size="sm" onClick={() => setCreateTaskModalOpen(true)}>
                            Agregar tarea
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setViewTaskModalOpen(true)}>
                            Ver tarea
                        </Button>   
                    </div>
                }
            >
                <ViewDetailCard fields={[
                    { label: "Tipo de documento", value: user.user_document_type },
                    { label: "Número documento", value: user.user_document },
                    { label: "Grupo", value: user.groups?.map(g => g.name).join(",") },
                    { label: "Fecha inicio", value: formatDate(user.user_date_start) },
                    { label: "Fecha fin", value: formatDate(user.user_date_end) },
                    { label: "Correo electrónico", value: user.email },
                    { label: "Número telefónico", value: user.user_tel },
                    { label: "Dirección", value: user.user_addres },
                    { label: "Segundo teléfono", value: user.user_tel2 },
                    { label: "Correo institucional", value: user.user_email2 },
                ]} />

                {/* Modal para agregar tarea; mismo patrón de backdrop + stopPropagation usado en UserRegisterForm */}
                {createTaskModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setCreateTaskModalOpen(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <TaskCreateModal
                                onClose={() => setCreateTaskModalOpen(false)}
                                onTaskCreated={(newTask) => {
                                    // Aquí se decide qué hacer con la tarea creada,
                                    // por ejemplo enviarla al backend asociada a este usuario (user.id)
                                    console.log("Tarea creada para el usuario", user.id, newTask)
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Modal para ver las tareas del usuario, con paginación si tiene más de una */}
                {viewTaskModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setViewTaskModalOpen(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <TaskViewModal
                                // TEMPORAL: se muestran las primeras tareas de ejemplo de data/tasks.js,
                                // sin filtrar por usuario, solo para previsualizar el modal y su paginación
                                // sin depender de que el nombre del usuario coincida con los datos de ejemplo.
                                // Cuando exista el endpoint real, esto se reemplaza por las tareas
                                // que venga del backend (ya sea anidadas en `user` o por fetch aparte).
                                tasks={tasks.slice(0, 4)}
                                onClose={() => setViewTaskModalOpen(false)}
                            />
                        </div>
                    </div>
                )}
            </ViewPageTemplate>
    )
}
