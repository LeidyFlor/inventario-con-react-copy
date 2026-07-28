// @refresh reset
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { StatusSwitch, Alert } from "@/shared/"
import MaterialRowActions from "../components/MaterialRowActions"
import { toggleMaterialStatus } from "../services/materialService"
import { getMaterialStates } from "../services/selectService"
import Swal from "sweetalert2"
import { usePermissions } from "@/features/permissions/context/PermissionsContext"
import { PERM } from "@/features/permissions/config/perms"

// Componente separado para poder usar el hook useNavigate
// (los hooks no se pueden llamar dentro de la función cell directamente)
function MaterialNameCell({ material }) {
    const navigate = useNavigate();
    return (
        <span
            onDoubleClick={() => navigate(`/dashboard/materials/${material.id}/view`)}
            className="cursor-pointer hover:underline"
        >
            {material.material_name}
        </span>
    );
}

// Muestra el estado del material solo cuando está inactivo
function MaterialStateTag({ isActive, state }) {
    if (isActive) return <span className="text-success text-small font-semibold">Disponible</span>

    const labels = {
        no_disponible: "No disponible",
        prestado: "Prestado",
        traslado: "Traslado",
        baja: "Baja",
    }
    return <span className="text-text-primary text-small font-semibold">{labels[state] ?? state}</span>
}

export const getMaterialsColumns = (setMaterials) => [

    // Nombre del material — doble clic navega al visualizar
    {
        accessorKey: "material_name",
        header: "Nombre",
        cell: ({ row }) => <MaterialNameCell material={row.original} />,
    },

    // Marca
    {
        accessorKey: "brand_name",
        header: "Marca",
    },

    // Cuentadante
    {
        accessorKey: "inventory_manager_name",
        header: "Cuentadante",
    },

    // Cantidad disponible (calculada en el backend)
    {
        accessorKey: "material_quantity_available",
        header: "Cantidad disponible",
    },

    // Ubicación
    // {
    //     accessorKey: "material_location",
    //     header: "Ubicación",
    // },

    // Estado — muestra "Disponible" si activo, o el motivo si inactivo
    {
        id: "estado",
        header: "Condición",
        cell: ({ row }) => (
            <MaterialStateTag
                isActive={row.original.is_active}
                state={row.original.material_state}
            />
        ),
    },

    // Switch activo/inactivo — pide motivo al desactivar
    {
        id: "is_active",
        header: "Estado",
        cell: ({ row }) => (
            <MaterialStatusCell material={row.original} setMaterials={setMaterials} />
        ),
    },

    // Acciones (editar, ver detalle)
    {
        id: "actions",
        cell: ({ row }) => <MaterialRowActions material={row.original} />,
    },
]

// Componente separado para poder usar el hook usePermissions
// (los hooks no se pueden llamar dentro de la función cell directamente)
function MaterialStatusCell({ material, setMaterials }) {
    const { hasPerm } = usePermissions()

    const handleChange = async (newValue) => {
                if (!newValue) {
                    // Pedir confirmación y motivo al desactivar
                    const states = getMaterialStates()
                    const options = states.map(s => `<option value="${s.value}">${s.label}</option>`).join("")

                    const { value: reason, isConfirmed } = await Swal.fire({
                        title: "¿Desactivar material?",
                        html: `
                            <p class="swal-content pb-2">Selecciona el motivo:</p>
                            <select id="swal-reason" class="swal2-input">
                                <option value="">Seleccione una opción</option>
                                ${options}
                            </select>
                        `,
                        confirmButtonText: "Confirmar",
                        cancelButtonText: "Cancelar",
                        showCancelButton: true,
                        customClass: {
                            confirmButton: "swal-btn-confirm",
                            cancelButton: "swal-btn-cancel",
                            actions: "swal-actions",
                        },
                        buttonsStyling: false,
                        preConfirm: () => {
                            const val = document.getElementById("swal-reason").value
                            if (!val) {
                                Swal.showValidationMessage("Debes seleccionar un motivo")
                            }
                            return val
                        }
                    })

                    if (!isConfirmed) {
                        // Revierte la animación del switch al cancelar
                        setMaterials(prev => [...prev])
                        return
                    }

                    try {
                        await toggleMaterialStatus(material.id, false, reason)
                        setMaterials(prev =>
                            prev.map(m => m.id === material.id
                                ? { ...m, is_active: false, material_state: reason }
                                : m
                            )
                        )
                    } catch {
                        Alert.error("Error", "No se pudo desactivar el material")
                    }
                } else {
                    // Reactivar sin motivo — confirmar simplemente
                    const result = await Alert.confirm(
                        "¿Reactivar material?",
                        `${material.material_name} volverá a estar disponible.`
                    )
                    if (!result.isConfirmed) {
                        // Revierte la animación del switch al cancelar
                        setMaterials(prev => [...prev])
                        return
                    }

                    try {
                        await toggleMaterialStatus(material.id, true)
                        setMaterials(prev =>
                            prev.map(m => m.id === material.id
                                ? { ...m, is_active: true, material_state: null }
                                : m
                            )
                        )
                    } catch {
                        Alert.error("Error", "No se pudo reactivar el material")
                    }
                }
            }

    // Sin permiso para activar/desactivar solo se muestra el estado como texto
    if (!hasPerm(PERM.CONSUMABLE_DELETE)) {
        return (
            <span className={material.is_active ? "text-brand" : "text-text-muted"}>
                {material.is_active ? "Activo" : "Inactivo"}
            </span>
        )
    }

    return (
        <StatusSwitch
            checked={material.is_active}
            onChange={handleChange}
            className="inline-flex"
        />
    )
}