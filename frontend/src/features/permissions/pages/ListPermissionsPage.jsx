import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
// Importados desde su archivo y no desde el barril "@/shared", que exporta
// DashboardLayout e introduce una importación circular con PermissionsContext
import Select from "@/shared/components/Select.jsx";
import { Alert } from "@/shared/components/utils/alert.js";
import PermissionsForm from "../components/PermissionsForm";
import { peticion } from "@/shared/services/peticion";
import {
    getPermissions,
    getGroupDetail,
    assignGroupPermissions,
    getUserPermissions,
    assignUserPermissions,
} from "../services/permissionsService";
import { Ping } from 'ldrs/react'
import 'ldrs/react/Ping.css'
import { usePermissions } from "../context/PermissionsContext"

async function fetchGroups() {
    const token = sessionStorage.getItem("token")
    const res = await peticion("/api/groups/", { headers: { "Authorization": `Bearer ${token}` } })
    if (!res.ok) throw new Error()
    return res.json()
}

async function fetchUsers() {
    const token = sessionStorage.getItem("token")
    const res = await peticion("/api/users/", { headers: { "Authorization": `Bearer ${token}` } })
    if (!res.ok) throw new Error()
    return res.json()
}

export default function ListPermissionsPage() {
    // La gestión de permisos es exclusiva del super administrador.
    // También está validado en el backend, esto solo evita mostrar la vista
    // si alguien escribe la URL directamente.
    const { isSuperuser, loading: loadingPermsCtx } = usePermissions()

    const [groups, setGroups]               = useState([])
    const [users, setUsers]                 = useState([])
    const [allPermissions, setAllPermissions] = useState([])

    // selección mutuamente exclusiva
    const [selectedGroupId, setSelectedGroupId] = useState("")
    const [selectedUserId, setSelectedUserId]   = useState("")

    // codenames activos del grupo/usuario seleccionado
    const [activeCodenames, setActiveCodenames] = useState([])
    // codenames heredados de grupos (solo para usuarios individuales, solo lectura)
    const [groupCodenames, setGroupCodenames] = useState([])
    const [loading, setLoading]   = useState(true)
    const [saving, setSaving]     = useState(false)
    const [loadingPerms, setLoadingPerms] = useState(false)

    useEffect(() => {
        // Sin ser superadmin no se cargan los datos
        if (loadingPermsCtx || !isSuperuser) {
            setLoading(false)
            return
        }
        Promise.all([fetchGroups(), fetchUsers(), getPermissions()])
            .then(([groupsData, usersData, permsData]) => {
                setGroups(groupsData.filter(g => g.is_active))
                setUsers(usersData.filter(u => u.is_active))
                setAllPermissions(permsData)
            })
            .catch(() => Alert.error("Error", "No se pudieron cargar los datos"))
            .finally(() => setLoading(false))
    }, [isSuperuser, loadingPermsCtx])

    // Convierte IDs de permisos → codenames usando el mapa del backend
    const idsToCodenames = (ids) =>
        ids.map(id => allPermissions.find(p => p.id === id)?.codename).filter(Boolean)

    const handleGroupChange = async (e) => {
        const id = e.target.value
        setSelectedGroupId(id)
        setSelectedUserId("") // limpiar usuario
        setActiveCodenames([])
        setGroupCodenames([])
        if (!id) return
        setLoadingPerms(true)
        try {
            const detail = await getGroupDetail(id)
            setActiveCodenames(idsToCodenames(detail.permissions))
        } catch {
            Alert.error("Error", "No se pudieron cargar los permisos del grupo")
        } finally {
            setLoadingPerms(false)
        }
    }

    const handleUserChange = async (e) => {
        const id = e.target.value
        setSelectedUserId(id)
        setSelectedGroupId("") // limpiar grupo
        setActiveCodenames([])
        setGroupCodenames([])
        if (!id) return
        setLoadingPerms(true)
        try {
            const data = await getUserPermissions(id)
            setActiveCodenames(idsToCodenames(data.permissions))
            setGroupCodenames(idsToCodenames(data.group_permissions ?? []))
        } catch {
            Alert.error("Error", "No se pudieron cargar los permisos del usuario")
        } finally {
            setLoadingPerms(false)
        }
    }

    const handleSave = async (selectedCodenames) => {
        const ids = selectedCodenames
            .map(codename => allPermissions.find(p => p.codename === codename)?.id)
            .filter(Boolean)

        setSaving(true)
        try {
            if (selectedGroupId) {
                const group = groups.find(g => g.id === Number(selectedGroupId))
                await assignGroupPermissions(selectedGroupId, ids)
                setActiveCodenames(selectedCodenames)
                Alert.success("Permisos guardados", `Permisos del grupo "${group?.name}" actualizados.`)
            } else if (selectedUserId) {
                const user = users.find(u => u.id === Number(selectedUserId))
                await assignUserPermissions(selectedUserId, ids)
                setActiveCodenames(selectedCodenames)
                Alert.success("Permisos guardados", `Permisos de "${user?.first_name} ${user?.last_name}" actualizados.`)
            }
        } catch {
            Alert.error("Error", "No se pudieron guardar los permisos")
        } finally {
            setSaving(false)
        }
    }

    const groupOptions   = groups.map(g => ({ value: String(g.id), label: g.name }))
    const userOptions    = users.map(u => ({ value: String(u.id), label: `${u.first_name} ${u.last_name}` }))
    const hasSelection   = selectedGroupId || selectedUserId

    if (loading || loadingPermsCtx) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando..</p>
        </div>)

    if (!isSuperuser) return (
        <div className="flex items-center justify-center min-h-40">
            <p className="text-text-muted text-center">
                Solo el super administrador puede gestionar los permisos del sistema.
            </p>
        </div>)

    return (
        <div className="flex flex-col lg:flex-row gap-8 justify-between">

            {/* Panel izquierdo — selección */}
            <div className="lg:w-72 shrink-0 flex flex-col gap-6">
                <div className="mt-2 mb-2 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5 place-items-center">
                        <Settings className="text-brand" />
                        Gestión de permisos
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                {/* Select de grupo */}
                <div className="flex flex-col gap-2">
                    <p className="text-text-primary text-sm font-semibold">Grupo de usuarios</p>
                    <Select
                        label="Seleccione un grupo"
                        name="group"
                        value={selectedGroupId}
                        onChange={handleGroupChange}
                        options={groupOptions}
                    />
                    {selectedGroupId && (
                        <p className="text-xs text-text-muted mt-1">
                            Los permisos aplican a todos los usuarios del grupo.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border-green-container" />
                    <span className="text-text-muted text-xs">ó</span>
                    <div className="flex-1 h-px bg-border-green-container" />
                </div>

                {/* Select de usuario individual */}
                <div className="flex flex-col gap-1">
                    <p className="text-text-muted text-sm font-semibold">Usuario individual</p>
                    <Select
                        label="Seleccione un usuario"
                        name="user"
                        value={selectedUserId}
                        onChange={handleUserChange}
                        options={userOptions}
                    />
                    {selectedUserId && (
                        <p className="text-xs text-text-muted mt-1">
                            En los permisos de usuario individual se muestran los permisos del grupo (no editables desde esta vista), y se pueden adicionar más permisos individuales.
                        </p>
                    )}
                </div>
            </div>

            {/* Panel derecho — formulario de permisos */}
            <div className="flex-1">
                {loadingPerms ? (
                    <div className="flex items-center justify-center h-full min-h-40">
                        <div className="flex flex-col place-items-center gap-2">
                            <Ping size="45" speed="1.5" color="#56B526" />
                            <p className="text-text-muted text-center">Cargando permisos</p>
                        </div>
                    </div>
                ) : hasSelection ? (
                    <>
                        <div className="mb-1 max-w-max">
                            <h2 className="text-gradient-title text-h3 pb-0.5">
                                {selectedGroupId
                                    ? `Permisos — ${groups.find(g => String(g.id) === selectedGroupId)?.name}`
                                    : `Permisos — ${users.find(u => String(u.id) === selectedUserId)?.first_name} ${users.find(u => String(u.id) === selectedUserId)?.last_name}`
                                }
                            </h2>
                            <div className="h-0.5 bg-gradiant-title-line"></div>
                        </div>
                        <PermissionsForm
                            key={selectedGroupId || selectedUserId}
                            initialPermissions={activeCodenames}
                            groupPermissions={groupCodenames}
                            allPermissions={allPermissions}
                            onSave={handleSave}
                            isLoading={saving}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full min-h-40">
                        <p className="text-text-muted">Selecciona un grupo o usuario para ver sus permisos</p>
                    </div>
                )}
            </div>

        </div>
    )
}
