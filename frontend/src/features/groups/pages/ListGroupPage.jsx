import { useState, useEffect } from "react"
import DataTable from "@/shared/components/DataTable"
import { getGroupsColumns } from "../table/groupsColumns"
import { Button, Alert } from "@/shared/"
import { UsersRound } from "lucide-react"
import GroupRegisterModal from "../components/GroupRegisterModal"
import { getGroups } from "../services/groupService"
import { Ping } from "ldrs/react"
import "ldrs/react/Ping.css"

export default function ListGroupPage() {
    const [modalAbierto, setModalAbierto] = useState(false)
    const [groups, setGroups]             = useState([])
    const [loading, setLoading]           = useState(true)

    useEffect(() => {
        getGroups()
            .then(setGroups)
            .catch(() => Alert.error("Error", "No se pudieron cargar los grupos"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex flex-col place-items-center gap-2">
            <Ping size="45" speed="1.5" color="#56B526" />
            <p className="text-text-muted text-center">Cargando grupos...</p>
        </div>
    )

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between">
                <div className="mb-2 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <UsersRound className="text-brand" />
                        Listar grupos
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex gap-6">
                    <Button variant="primary" size="sm" onClick={() => setModalAbierto(true)}>
                        Crear grupo
                    </Button>
                </div>
            </div>

            <DataTable
                data={groups}
                columns={getGroupsColumns(setGroups)}
            />

            {modalAbierto && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setModalAbierto(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GroupRegisterModal
                            onClose={() => setModalAbierto(false)}
                            onGroupCreated={(newGroup) => {
                                setGroups(prev => [...prev, { id: newGroup.value, name: newGroup.label, is_active: true, permissions: [] }])
                                setModalAbierto(false)
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
