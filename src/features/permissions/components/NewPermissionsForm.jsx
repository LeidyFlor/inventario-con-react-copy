import { Button } from "@/shared";
import React, { useState } from "react";
import SettingsIcon from "@/assets/icons/settings.svg?react";

// Datos de los grupos de permisos con sus respectivos permisos
const PERMISSION_GROUPS = [
    {
        id: "usuarios",
        label: "Gestión Usuarios",
        permissions: [
            { id: "crear_usuarios",      label: "Crear usuarios" },
            { id: "visualizar_usuarios", label: "Visualizar usuarios" },
            { id: "actualizar_usuarios", label: "Actualizar usuarios" },
            { id: "listar_usuarios",     label: "Listar usuarios" },
            { id: "activar_usuarios",    label: "Activar/Desactivar usuarios" },
            { id: "reporte_usuarios",    label: "Generar reporte usuarios" },
        ],
    },
    {
        id: "material_consumo",
        label: "Gestión material de consumo",
        permissions: [
            { id: "crear_consumo",      label: "Crear material consumo" },
            { id: "visualizar_consumo", label: "Visualizar material consumo" },
            { id: "actualizar_consumo", label: "Actualizar material consumo" },
            { id: "listar_consumo",     label: "Listar matrial consumo" },
            { id: "activar_consumo",    label: "Activar/Desactivar material consumo" },
            { id: "reporte_consumo",    label: "Generar reporte material consumo" },
        ],
    },
    {
        id: "material_devolutivo",
        label: "Gestión material devolutivo",
        permissions: [
            { id: "crear_devolutivo",      label: "Crear material devolutivo" },
            { id: "visualizar_devolutivo", label: "Visualizar material devolutivo" },
            { id: "actualizar_devolutivo", label: "Actualizar material devolutivo" },
            { id: "listar_devolutivo",     label: "Listar material devolutivo" },
            { id: "activar_devolutivo",    label: "Activar/Desactivar material devolutivo" },
            { id: "reporte_devolutivo",    label: "Generar reporte material devolutivo" },
        ],
    },
    {
        id: "prestamos",
        label: "Gestión préstamos",
        permissions: [
            { id: "crear_prestamo",      label: "Crear préstamo" },
            { id: "visualizar_prestamo", label: "Visualizar préstamo" },
            { id: "actualizar_prestamo", label: "Actualizar préstamo" },
            { id: "listar_prestamos",    label: "Listar préstamos" },
            { id: "activar_prestamo",    label: "Activar/Desactivar préstamo" },
            { id: "reporte_prestamos",   label: "Generar reporte préstamos" },
            { id: "retornar_prestamos",  label: "Retornar préstamos" },
            { id: "aprobar_retorno",     label: "Aprobar retorno préstamos" },
        ],
    },
];

export default function PermissionsForm() {
    const [grupoUsuario, setGrupoUsuario] = useState("");
    const [usuarioIndividual, setUsuarioIndividual] = useState("");

    // Estado de checkboxes: { permission_id: boolean }
    // Se inicializa con todos los permisos en false usando reduce
    const [permisos, setPermisos] = useState(
        PERMISSION_GROUPS.flatMap((g) => g.permissions).reduce(
            (acc, p) => ({ ...acc, [p.id]: false }),
            {}
        )
    );

    // Handle eventos. onChange cada vez que se marca o desmarca un checkbox
    const handlePermissionToggle = (permId) => {
        setPermisos({ ...permisos, [permId]: !permisos[permId] });
        console.log("Permiso:", permId, !permisos[permId]);
    };

    // onBlur toma el valor cuando uno sale del campo select
    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        if (name === "grupoUsuario")      setGrupoUsuario(value);
        if (name === "usuarioIndividual") setUsuarioIndividual(value);
        console.log("Select:", name, value);
    };

    const handleSave = () => {
        console.log("Permisos guardados:", permisos);
    };

    return (
        // Contenedor principal centrado con ancho máximo
        <div className="max-w-7xl mx-auto px-10">

            {/* Botón Atrás */}
            <div className="mb-10">
                <Button variant="secondary" size="sm">
                    Atrás
                </Button>
            </div>

            {/* Título centrado con ícono settings */}
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center gap-3">
                    <SettingsIcon className="w-10 h-10 text-green-700" />
                    <div>
                        <h1 className="text-gradient-title text-2xl pb-0.5">
                            Gestión de permisos
                        </h1>
                        {/* Línea degradada del título */}
                        <div className="h-0.5 bg-gradiant-title-line" />
                    </div>
                </div>
            </div>

            {/* Layout de dos columnas: selectores | panel de permisos */}
            <div className="flex gap-8 items-start">

                {/* Columna izquierda: selectores de grupo y usuario */}
                <div className="flex flex-col gap-10 min-w-40">

                    {/* Selector: Grupos usuarios */}
                    <div className="flex flex-col gap-2">
                        <div className="mb-1">
                            <span className="font-semibold text-gray-800">
                                Grupos usuarios
                            </span>
                            <div className="h-0.5 bg-gradiant-title-line mt-0.5" />
                        </div>
                        <select
                            name="grupoUsuario"
                            value={grupoUsuario}
                            onChange={handleSelectChange}
                            className="
                                w-full h-14
                                rounded-2xl
                                border-2 border-input-border
                                px-4
                                text-text-primary
                                bg-input-fill
                                focus:outline-none
                                focus:ring-2 focus:ring-focus-ring
                                focus:border-focus-border
                                transition-all duration-300
                                appearance-none
                                cursor-pointer
                            "
                        >
                            <option value="" disabled>Grupo usuarios ▾</option>
                            <option value="grupo1">Grupo 1</option>
                            <option value="grupo2">Grupo 2</option>
                        </select>
                    </div>

                    {/* Selector: usuario individual */}
                    <div className="flex flex-col gap-2">
                        <div className="mb-1">
                            <span className="font-semibold text-gray-800">
                                Usuario individual
                            </span>
                            <div className="h-0.5 bg-gradiant-title-line mt-0.5" />
                        </div>
                        <select
                            name="usuarioIndividual"
                            value={usuarioIndividual}
                            onChange={handleSelectChange}
                            className="
                                w-full h-14
                                rounded-2xl
                                border-2 border-input-border
                                px-4
                                text-text-primary
                                bg-input-fill
                                focus:outline-none
                                focus:ring-2 focus:ring-focus-ring
                                focus:border-focus-border
                                transition-all duration-300
                                appearance-none
                                cursor-pointer
                            "
                        >
                            <option value="" disabled>Seleccione Usuario ▾</option>
                            <option value="user1">Usuario 1</option>
                            <option value="user2">Usuario 2</option>
                        </select>
                    </div>
                </div>

                {/* Panel derecho: grupos de permisos con checkboxes */}
                <div className="relative flex-1">
                    <div className="
                        bg-gray-100
                        rounded-2xl
                        border border-gray-300
                        p-6
                        flex flex-col gap-6
                        max-h-130
                        overflow-y-auto
                    ">
                        {PERMISSION_GROUPS.map((group, index) => (
                            <div key={group.id}>

                                {/* Título del grupo con su checkbox */}
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id={`group-${group.id}`}
                                        className="w-4 h-4 accent-teal-600 cursor-pointer"
                                    />
                                    <label
                                        htmlFor={`group-${group.id}`}
                                        className="font-semibold text-teal-600 cursor-pointer"
                                    >
                                        {group.label}
                                    </label>
                                </div>

                                {/* Permisos individuales del grupo */}
                                <div className="flex flex-wrap gap-x-3 gap-y-2 pl-2">
                                    {group.permissions.map((perm) => (
                                        <div key={perm.id} className="flex items-center gap-1.5">
                                            <input
                                                type="checkbox"
                                                id={perm.id}
                                                checked={permisos[perm.id]}
                                                onChange={() => handlePermissionToggle(perm.id)}
                                                className="w-4 h-4 accent-teal-600 cursor-pointer"
                                            />
                                            <label
                                                htmlFor={perm.id}
                                                className="text-xs text-gray-700 cursor-pointer"
                                            >
                                                {perm.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {/* Línea divisora entre grupos */}
                                {index < PERMISSION_GROUPS.length - 1 && (
                                    <div className="h-px bg-teal-300 mt-4" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Flecha para guardar o continuar */}
                    <button
                        type="button"
                        onClick={handleSave}
                        className="
                            absolute -right-6 top-1/2 -translate-y-1/2
                            flex items-center justify-center
                            w-10 h-10
                            text-purple-600
                            text-2xl font-bold
                            hover:text-purple-800
                            transition-colors duration-200
                        "
                    >
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
}