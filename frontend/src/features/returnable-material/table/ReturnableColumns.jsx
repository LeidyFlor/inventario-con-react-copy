// src/features/returnable-material/table/ReturnableColumns.jsx
// @refresh reset
import { useState } from "react"
import { StatusSwitch, Alert } from "@/shared"
import ReturnableRowAction from "../components/ReturnableRowAction"
import { toggleReturnableStatus } from "../services/returnableService"
import { getMaterialStates } from "../services/selectService"
import Swal from "sweetalert2"

// Muestra la categoría como texto legible
function CategoryTag({ category }) {
    const labels = {
        herramienta:        "Herramienta",
        maquinaria_equipos: "Maquinaria y equipos",
        muebles_enseres:    "Muebles y enseres",
    }
    return <span className="text-small">{labels[category] ?? category}</span>
}

// Muestra el estado: "Disponible" si activo, o el motivo si inactivo
function MaterialStateTag({ isActive, state }) {
    if (isActive) return <span className="text-success text-small font-semibold">Disponible</span>
    const labels = {
        no_disponible: "No disponible",
        prestado:      "Prestado",
        traslado:      "Traslado",
        baja:          "Baja",
    }
    return <span className="text-text-primary text-small font-semibold">{labels[state] ?? state}</span>
}

// Recibe setReturnables para actualizar la lista localmente sin recargar
export const getReturnableColumns = (setReturnables) => [

    // Nombre
    {
        accessorKey: "material_name",
        header: "Nombre",
    },

    // Placa SENA (obligatoria en devolutivos)
    {
        accessorKey: "material_barcode_sena",
        header: "Placa SENA",
    },

    // Serial
    {
        accessorKey: "material_serial",
        header: "Serial",
    },

    // Categoría con etiqueta legible
    {
        id: "categoria",
        header: "Categoría",
        cell: ({ row }) => <CategoryTag category={row.original.material_category} />,
    },

    // Cuentadante
    {
        accessorKey: "inventory_manager_name",
        header: "Cuentadante",
    },

    // Estado textual
    {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
            <MaterialStateTag
                isActive={row.original.is_active}
                state={row.original.material_state}
            />
        ),
    },

    // Switch activo/inactivo con motivo al desactivar
    {
        id: "is_active",
        header: "Activo",
        cell: ({ row }) => {
            const material = row.original

            const handleChange = async (newValue) => {
                if (!newValue) {
                    // Pedir motivo de desactivación
                    const states = getMaterialStates()
                    const options = states.map(s =>
                        `<option value="${s.value}">${s.label}</option>`
                    ).join("")

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
                            if (!val) Swal.showValidationMessage("Debes seleccionar un motivo")
                            return val
                        }
                    })

                    if (!isConfirmed) {
                        // Revierte animación del switch al cancelar
                        setReturnables(prev => [...prev])
                        return
                    }

                    try {
                        await toggleReturnableStatus(material.id, false, reason)
                        setReturnables(prev =>
                            prev.map(m => m.id === material.id
                                ? { ...m, is_active: false, material_state: reason }
                                : m
                            )
                        )
                    } catch {
                        Alert.error("Error", "No se pudo desactivar el material")
                    }

                } else {
                    // Reactivar
                    const result = await Alert.confirm(
                        "¿Reactivar material?",
                        `${material.material_name} volverá a estar disponible.`
                    )
                    if (!result.isConfirmed) {
                        setReturnables(prev => [...prev])
                        return
                    }

                    try {
                        await toggleReturnableStatus(material.id, true)
                        setReturnables(prev =>
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

            return (
                <StatusSwitch
                    checked={material.is_active}
                    onChange={handleChange}
                    className="inline-flex"
                />
            )
        },
    },

    // Acciones (editar, ver detalle)
    {
        id: "actions",
        cell: ({ row }) => <ReturnableRowAction returnable={row.original} />,
    },
]
