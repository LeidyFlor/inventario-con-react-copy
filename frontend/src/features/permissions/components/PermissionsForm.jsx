// src/features/permissions/components/PermissionsForm.jsx

import { useState } from "react";
import { PERMISSIONS } from "../config/permissions.config";
import { Checkbox, IconButton, Button } from "@/shared/"; // ajusta el path según tu estructura

export default function PermissionsForm({
    initialPermissions = [], // permisos que ya tiene el grupo seleccionado
    onSave,             // función que recibe el array de permisos al guardar
    isLoading = false
}) {
    //selected - array de strings de los keys(["Usuarios_crear, "Usuarios_listar"], etc..)
    const [selected, setSelected] = useState(initialPermissions);
    const [isEditing, setIsEditing] = useState(false); //Estado para saber si se muestran los checkbox y el guardar


    //Marca permisos individuales. prev es el estado anterior
    const toggle = (key) => {
        setSelected(prev =>
            prev.includes(key)
                ? prev.filter(p => p !== key)
                : [...prev, key]
        );
    };
    // Marca o desmarca a TODOS los permisos de una carteoría. categoryKeys se queda solo con las keys string de las categorias y las almacena en un solo array
    const toggleCategory = (categoryPermissions) => {
        const categoryKeys = categoryPermissions.map(p => p.key);
        const allSelected = categoryKeys.every(k => selected.includes(k));

        setSelected(prev =>
            allSelected
                ? prev.filter(k => !categoryKeys.includes(k)) // desmarcar todos
                : [...new Set([...prev, ...categoryKeys])]     // marcar todos
                //new Set elimina las llaves repetipos, cuando se une las anteirores (...prev) y las nuevas (...categoryKeys), y lo convierte en un array de nuevo con [...] rest operator
        );
    };

    const handleSave = () => {
        onSave(selected); // le devuelve al padre el array con los keys seleccionados
        setIsEditing(false); // vuelve a modo lectura al guardar
    };

    const handleCancel = () => {
        setSelected(initialPermissions); // restaura los permisos originales
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col gap-6 lg:h-180 lg:overflow-y-auto">
            {/* boton editar, solo se ve cuando no se está editando */}
            {!isEditing && (
                <div className="self-end">
                    <Button onClick={() => setIsEditing(true)} variant="warning" size="sm">
                        Editar
                    </Button>
                </div>
            )}
            {/* ACCIONES - boton cancelar y guardar que solo se muestran al editar */}
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

            {PERMISSIONS.map(group => {
                //allSelected prmite que el checkbox superior elija todos los campos del crud
                const allSelected = group.permissions.every(p => selected.includes(p.key));

                return (
                        <div key={group.key} className="border rounded-lg p-4 flex flex-col gap-3 bg-surface">
                            {/* Checkbox de categoría — marca/desmarca todos  COMPARTE COLOR CON EL BOTÓN SECUNDARIO*/}
                            <Checkbox
                                id={group.key}
                                name={group.key}
                                label={group.category}
                                checked={allSelected}
                                onChange={() => toggleCategory(group.permissions)}
                                className="font-bold text-boton-fill-color-secondary"
                                disabled={!isEditing} //Deshabilitado si no se está editando
                            />

                            <div className="w-full h-0.5 bg-focus-ring rounded-3xl" />

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
                                        disabled={!isEditing} //Deshabilitado si no se está editando
                                        className="text-text-primary"
                                    />
                                ))}
                            </div>
                        </div>
                );
            })}
            
        </div>
    );
}