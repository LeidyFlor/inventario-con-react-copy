// src/features/permissions/components/PermissionsForm.jsx

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox, IconButton, Button } from "@/shared/";

const GROUPS_PER_PAGE = 3;

// Mapeo de prefijos de codename → etiqueta en español (orden importa: más específico primero)
const ACTION_LABELS = [
    ['generar_reporte_', 'Generar reporte'],
    ['listar_',          'Listar'],
    ['add_',             'Crear'],
    ['view_',            'Visualizar'],
    ['change_',          'Actualizar'],
    ['delete_',          'Activar/Desactivar'],
]

// Excepciones al mapeo de arriba: modelos donde delete_ borra de verdad en vez
// de desactivar. Se listan por codename completo para no adivinar por el modelo.
//
// Las cotizaciones son archivos PDF: no tienen is_active y al eliminarlas se
// borra el registro y el archivo del storage. Decir "Activar/Desactivar" ahí
// engañaría sobre lo que realmente hace el permiso.
const ETIQUETAS_ESPECIALES = {
    delete_quotation: 'Eliminar',
}

function getActionLabel(codename) {
    if (ETIQUETAS_ESPECIALES[codename]) return ETIQUETAS_ESPECIALES[codename]
    for (const [prefix, label] of ACTION_LABELS) {
        if (codename.startsWith(prefix)) return label
    }
    return codename
}

function buildGroups(allPermissions) {
    const groupMap = {}
    for (const perm of allPermissions) {
        const model = perm.content_type__model
        const plural = perm.verbose_name_plural ?? model
        if (!groupMap[model]) {
            groupMap[model] = {
                key: model,
                category: plural.charAt(0).toUpperCase() + plural.slice(1),
                permissions: []
            }
        }
        groupMap[model].permissions.push({
            key: perm.codename,
            label: `${getActionLabel(perm.codename)} ${plural}`
        })
    }
    return Object.values(groupMap)
}

export default function PermissionsForm({
    initialPermissions = [], // codenames individuales del usuario (editables)
    groupPermissions = [],   // codenames heredados de grupos (solo lectura)
    allPermissions = [],     // lista completa de permisos del sistema (del backend)
    onSave,                  // función que recibe el array de codenames al guardar
    isLoading = false
}) {
    const [selected, setSelected] = useState(initialPermissions);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    // Reinicia la página cuando cambia la selección de grupo/usuario
    useEffect(() => {
        setCurrentPage(0);
    }, [initialPermissions]);

    const toggle = (key) => {
        setSelected(prev =>
            prev.includes(key)
                ? prev.filter(p => p !== key)
                : [...prev, key]
        );
    };

    const toggleCategory = (categoryPermissions) => {
        // Solo los permisos que NO vienen del grupo son editables
        const editableKeys = categoryPermissions
            .map(p => p.key)
            .filter(k => !groupPermissions.includes(k));
        if (editableKeys.length === 0) return;
        const allSelected = editableKeys.every(k => selected.includes(k));
        setSelected(prev =>
            allSelected
                ? prev.filter(k => !editableKeys.includes(k))
                : [...new Set([...prev, ...editableKeys])]
        );
    };

    const handleSave = () => {
        onSave(selected);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setSelected(initialPermissions);
        setIsEditing(false);
    };

    const groups = buildGroups(allPermissions);
    const totalPages = Math.ceil(groups.length / GROUPS_PER_PAGE);
    const pagedGroups = groups.slice(
        currentPage * GROUPS_PER_PAGE,
        currentPage * GROUPS_PER_PAGE + GROUPS_PER_PAGE
    );

    return (
        <div className="flex flex-col gap-1">
            {/* Botón editar — solo en modo lectura */}
            {!isEditing && (
                <div className="self-end">
                    <Button onClick={() => setIsEditing(true)} variant="warning" size="sm">
                        Editar
                    </Button>
                </div>
            )}

            {/* Acciones — solo al editar */}
            {isEditing && (
                <div className="flex gap-3 justify-between place-items-center">
                    <Button onClick={handleCancel} variant="secondary" size="sm">
                        Cancelar
                    </Button>
                    <IconButton
                        variant="primary"
                        size="md"
                        type="submit"
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? "Guardando..." : "Guardar permisos"}
                    </IconButton>
                </div>
            )}

            {/* Grupos de permisos paginados */}
            {pagedGroups.map(group => {
                // La categoría se considera "toda marcada" si cada permiso está
                // en selected (individual) O en groupPermissions (heredado)
                const allSelected = group.permissions.every(
                    p => selected.includes(p.key) || groupPermissions.includes(p.key)
                );
                return (
                    <div key={group.key} className="border border-boton-fill-color-secondary rounded-3xl p-4 flex flex-col gap-3 bg-surface">
                        <Checkbox
                            id={group.key}
                            name={group.key}
                            label={group.category}
                            checked={allSelected}
                            onChange={() => toggleCategory(group.permissions)}
                            className="font-bold text-boton-fill-color-secondary"
                            disabled={!isEditing}
                        />
                        <div className="w-full h-0.5 bg-background rounded-3xl" />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                            {group.permissions.map(permission => {
                                const isFromGroup = groupPermissions.includes(permission.key);
                                return (
                                    <Checkbox
                                        key={permission.key}
                                        id={permission.key}
                                        name={permission.key}
                                        label={permission.label}
                                        checked={selected.includes(permission.key) || isFromGroup}
                                        onChange={() => !isFromGroup && toggle(permission.key)}
                                        // Permisos de grupo: siempre deshabilitados (no se gestionan aquí)
                                        // Permisos individuales: deshabilitados solo en modo lectura
                                        disabled={isFromGroup || !isEditing}
                                        className={isFromGroup ? "text-text-muted" : "text-text-primary"}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Controles de paginación — solo si hay más de una página */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-1">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 0}
                        className="p-1 rounded-full text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>

                    <span className="text-sm text-text-muted">
                        {currentPage + 1} / {totalPages}
                    </span>

                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="p-1 rounded-full text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
                    >
                        <ChevronRight size={28} />
                    </button>
                </div>
            )}
        </div>
    );
}
