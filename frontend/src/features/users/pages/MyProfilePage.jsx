import { useState, useEffect } from "react";
import { ViewPageTemplate, ViewDetailCard, Button } from "@/shared/";
import { UserRound, KeyRound, ListTodo } from "lucide-react";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { TaskViewModal } from "@/features/tasks";
import { getMyProfile } from "@/features/permissions/services/permissionsService";
import { getTasksByUser, getTasksByGroup } from "@/features/tasks/services/taskService";

/**
 * Página "Mi perfil" — accesible para cualquier usuario autenticado.
 *
 * No requiere los permisos view_users ni listar_usuarios: usa el endpoint
 * /api/users/me/ que devuelve únicamente los datos del propio usuario.
 *
 * Es de solo lectura. Lo único que el usuario puede hacer es consultar
 * sus tareas asignadas y cambiar su propia contraseña. Cualquier cambio
 * en sus datos debe hacerlo un administrador con permiso de edición.
 */
export default function MyProfilePage() {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks]     = useState([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [viewTaskModalOpen, setViewTaskModalOpen] = useState(false);

    useEffect(() => {
        getMyProfile()
            .then(async (userData) => {
                setUser(userData)

                // Tareas individuales asignadas al usuario
                const userTasks = await getTasksByUser(userData.id).catch(() => [])

                // Tareas de cada grupo al que pertenece
                const groupTasksArrays = await Promise.all(
                    (userData.groups ?? []).map(g => getTasksByGroup(g.id).catch(() => []))
                )
                const groupTasks = groupTasksArrays.flat()

                setTasks([...userTasks, ...groupTasks])
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando perfil...</p>
        </div>
    );

    if (!user) return <p>No se pudo cargar tu perfil</p>;

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("es-CO", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    };

    return (
        <>
            <ViewPageTemplate
                title="Mi perfil"
                icon={<UserRound className="text-brand" />}
                image={user.user_image}
                name={`${user.first_name} ${user.last_name}`}
                estado={user.is_active}
                // Sin onEdit: el perfil propio es de solo lectura
                topActions={
                    <div className="flex gap-4 mb-3">
                        <Button variant="ghost" size="sm" onClick={() => setViewTaskModalOpen(true)}>
                            <ListTodo size={16} />
                            <p className="hidden md:block">Mis tareas</p>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                            <KeyRound size={20} />
                            <p className="hidden md:block">Cambiar contraseña</p>
                        </Button>
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

                <p className="mt-4 text-small text-text-muted">
                    Para modificar tus datos personales comunícate con un administrador.
                </p>
            </ViewPageTemplate>

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
