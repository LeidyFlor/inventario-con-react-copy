import { Pencil } from "lucide-react"
import { useState } from "react"
import GroupEditModal from "./GroupEditModal"
import { IconButtonReal } from "@/shared"

export default function GroupRowAction({ group, onUpdated }) {
    const [modalAbierto, setModalAbierto] = useState(false)

    return (
        <div className="flex gap-2 mx-auto">
            <IconButtonReal onClick={() => setModalAbierto(true)} variant="outline">
                <Pencil size={20} />
            </IconButtonReal>

            {modalAbierto && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setModalAbierto(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <GroupEditModal
                            group={group}
                            onClose={() => setModalAbierto(false)}
                            onUpdated={(updated) => {
                                onUpdated(updated)
                                setModalAbierto(false)
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
