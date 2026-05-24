// src/features/permissions/components/PermissionsForm.jsx

import { useState } from "react";
import { PERMISSIONS } from "../config/permissions.config";
import { Checkbox } from "@/shared/"; // ajusta el path según tu estructura

export default function PermissionsForm({
    initialPermissions = [], // permisos que ya tiene el grupo seleccionado
    onSave,                  // función que recibe el array de permisos al guardar
    isLoading = false
}) {
    const [selected, setSelected] = useState(initialPermissions);

    const toggle = (key) => {
        setSelected(prev =>
            prev.includes(key)
                ? prev.filter(p => p !== key)
                : [...prev, key]
        );
    };

    const toggleCategory = (categoryPermissions) => {
        const categoryKeys = categoryPermissions.map(p => p.key);
        const allSelected = categoryKeys.every(k => selected.includes(k));

        setSelected(prev =>
            allSelected
                ? prev.filter(k => !categoryKeys.includes(k))  // desmarcar todos
                : [...new Set([...prev, ...categoryKeys])]      // marcar todos
        );
    };

    const handleSave = () => {
        onSave(selected); // le devuelve al padre el array con los keys seleccionados
    };

    return (
        <div className="flex flex-col gap-6">
            {PERMISSIONS.map(group => {
                const allSelected = group.permissions.every(p => selected.includes(p.key));

                return (
                    <div key={group.key} className="border rounded-lg p-4 flex flex-col gap-3">
                        {/* Checkbox de categoría — marca/desmarca todos */}
                        <Checkbox
                            id={group.key}
                            name={group.key}
                            label={group.category}
                            checked={allSelected}
                            onChange={() => toggleCategory(group.permissions)}
                            className="font-medium"
                        />

                        <hr />

                        {/* Permisos individuales */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                            {group.permissions.map(permission => (
                                <Checkbox
                                    key={permission.key}
                                    id={permission.key}
                                    name={permission.key}
                                    label={permission.label}
                                    checked={selected.includes(permission.key)}
                                    onChange={() => toggle(permission.key)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
            <IconButton
                variant="primary"
                size="md"
                type="submit"
                onClick={handleSave}
                disabled={isLoading}
            >
                Guardar
                {isLoading ? "Guardando..." : "Guardar permisos"}
            </IconButton>
        </div>
    );
}