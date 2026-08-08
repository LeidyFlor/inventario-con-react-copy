import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { UserRound, KeyRound, ListTodo } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import { TaskCreateModal, TaskViewModal } from "@/features/tasks";
import { getUser, resetUserPassword } from "../services/userService";
import { Alert } from "@/shared/components/utils/alert.js";
import { createTaskForUser, getTasksByUser, getTasksByGroup } from "@/features/tasks/services/taskService";
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM, SCREEN_PERMS } from "@/features/permissions/config/perms";
import { formatearFechaFin } from "../config/indefiniteEndDate";

export default function ViewUserPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPerm, hasAllPerms } = usePermissions();
    const [user, setUser]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [tasks, setTasks]       = useState([]);
    const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [viewTaskModalOpen, setViewTaskModalOpen]     = useState(false);

    useEffect(() => {
        // El perfil y las tareas individuales no dependen entre sí, así que
        // van en paralelo. Antes iban encadenados: primero el usuario, después
        // sus tareas, y solo entonces las de cada grupo. Con una base remota
        // eso significaba sumar el tiempo de ida y vuelta de cada petición.
        Promise.all([
            getUser(id),
            getTasksByUser(id).catch(() => []),
        ])
            .then(async ([userData, userTasks]) => {
                setUser(userData)
                // La pantalla ya puede dibujarse con los datos del perfil;
                // las tareas de los grupos siguen cargando en segundo plano
                // en vez de bloquear todo el render.
                setLoading(false)

                const groupTasksArrays = await Promise.all(
                    (userData.groups ?? []).map(g => getTasksByGroup(g.id).catch(() => []))
                )
                setTasks([...userTasks, ...groupTasksArrays.flat()])
            })
            .catch((error) => {
                console.error(error)
                setLoading(false)
            });
    }, [id]);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando usuario...</p>
        </div>
    );

    if (!user) return <p>Usuario no encontrado</p>;

    const handleEdit = () => navigate(`/dashboard/users/${user.id}/edit`);

    /**
     * Restablece la contraseña de ESTE usuario (no la de quien está mirando).
     *
     * Antes este botón abría ChangePasswordModal, que llama a
     * /api/users/change-password/ — un endpoint que siempre actúa sobre
     * request.user. Es decir, le cambiaba la contraseña al administrador
     * logueado, no al usuario del perfil, y pedía "contraseña actual" del
     * usuario equivocado.
     */
    const handleResetPassword = async () => {
        const confirmacion = await Alert.confirm(
            "¿Restablecer la contraseña?",
            `Se generará una contraseña temporal y se enviará a ${user.email}. ` +
            `${user.first_name} tendrá 2 horas para cambiarla antes de que la cuenta se desactive.`
        );
        if (!confirmacion.isConfirmed) return;

        try {
            Alert.loading("Restableciendo contraseña...");
            const res = await resetUserPassword(user.id);
            Alert.close();
            Alert.success("Contraseña restablecida", res.message);
        } catch (err) {
            Alert.close();
            Alert.error("No se pudo restablecer", err.message);
        }
    };

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
                onEdit={hasAllPerms(SCREEN_PERMS.USER_EDIT) ? handleEdit : undefined}
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
                        {hasAllPerms(SCREEN_PERMS.USER_EDIT) && (
                        <Button variant="outline" size="sm" onClick={handleResetPassword}>
                            <KeyRound size={20} />
                            <p className="hidden md:block">Restablecer contraseña</p>
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
                    // Los usuarios de planta muestran "Indefinido" en vez de la fecha centinela
                    { label: "Fecha fin",            value: formatearFechaFin(user.user_date_end) },
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

        </>
    );
}
