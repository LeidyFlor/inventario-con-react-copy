import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { UserRound, KeyRound, ListTodo } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { TaskCreateModal, TaskViewModal } from "@/features/tasks";
import { getUser } from "../services/userService";
import { createTaskForUser, getTasksByUser, getTasksByGroup } from "@/features/tasks/services/taskService";
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM } from "@/features/permissions/config/perms";

export default function ViewUserPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPerm } = usePermissions();
    const [user, setUser]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [tasks, setTasks]       = useState([]);
    const [showPasswordModal, setShowPasswordModal]     = useState(false);
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [viewTaskModalOpen, setViewTaskModalOpen]     = useState(false);

    useEffect(() => {
        getUser(id)
            .then(async (userData) => {
                setUser(userData)

                // Tareas individuales del usuario
                const userTasks = await getTasksByUser(id).catch(() => [])

                // Tareas de cada grupo al que pertenece el usuario
                const groupTasksArrays = await Promise.all(
                    (userData.groups ?? []).map(g => getTasksByGroup(g.id).catch(() => []))
                )
                const groupTasks = groupTasksArrays.flat()

                setTasks([...userTasks, ...groupTasks])
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando usuario...</p>
        </div>
    );

    if (!user) return <p>Usuario no encontrado</p>;

    const handleEdit = () => navigate(`/dashboard/users/${user.id}/edit`);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("es-CO", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    };

    return (
        <>
            <ViewPageTemplate
                title="Perfil de usuario"
                icon={<UserRound className="text-brand" />}
                image={user.user_image}
                name={`${user.first_name} ${user.last_name}`}
                estado={user.is_active}
                onEdit={hasPerm(PERM.USER_CHANGE) ? handleEdit : undefined}
                topActions={
                    <div className="flex gap-4 mb-3">
                        {/* Agregar tarea usa el permiso propio de tareas */}
                        {hasPerm(PERM.TASK_ADD) && (
                        <Button variant="primary" size="sm" onClick={() => setCreateTaskModalOpen(true)}>
                            <p className="hidden md:block">Agregar tarea</p>
                        </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setViewTaskModalOpen(true)}>
                            <ListTodo size={16} />
                            <p className="hidden md:block">Tareas</p>
                        </Button>
                        {hasPerm(PERM.USER_CHANGE) && (
                        <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                            <KeyRound size={20} />
                            <p className="hidden md:block">Cambiar contraseña</p>
                        </Button>
                        )}
                    </div>
                }
            >
                <ViewDetailCard fields={[
                    { label: "Tipo de documento",    value: user.user_document_type },
                    { label: "Número documento",     value: user.user_document },
                    { label: "Grupo",                value: user.groups?.map(g => g.name).join(", ") },
                    { label: "Fecha inicio",         value: formatDate(user.user_date_start) },
                    { label: "Fecha fin",            value: formatDate(user.user_date_end) },
                    { label: "Correo electrónico",   value: user.email },
                    { label: "Número telefónico",    value: user.user_tel },
                    { label: "Dirección",            value: user.user_addres },
                    { label: "Segundo teléfono",     value: user.user_tel2 },
                    { label: "Correo institucional", value: user.user_email2 },
                    { label: "Cuentadante",          value: user.is_accountant ? "Sí" : "No" },
                    { label: "Staff",                value: user.is_staff      ? "Sí" : "No" },
                ]} />
            </ViewPageTemplate>

            {createTaskModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setCreateTaskModalOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskCreateModal
                            onClose={() => setCreateTaskModalOpen(false)}
                            onTaskCreated={async (newTask) => {
                                const created = await createTaskForUser(user.id, newTask)
                                setTasks(prev => [...prev, created])
                            }}
                        />
                    </div>
                </div>
            )}

            {viewTaskModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setViewTaskModalOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <TaskViewModal
                            tasks={tasks}
                            onClose={() => setViewTaskModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
        </>
    );
}
