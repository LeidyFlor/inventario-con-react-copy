import { Input, Button, IconButton } from "@/shared";
import React, { useState } from "react";
import FingerprintIcon from "@/assets/icons/fingerprint.svg?react";
import LoanIcon from "@/assets/icons/addfile.svg?react";

export default function NewLoanForm() {
    const [formData, setFormData] = useState({
        material: "",         // "devolutivo" | "consumible"
        usuarioSolicitante: "",
        grupoAprendices: "",
        fechaSalida: "",
        justificacion: "",
        fechaEntrega: "",
        tipoPrestamo: "",
    });

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        console.log("Input:", name, value);
    };

    const handleMaterialSelect = (material) => {
        setFormData({ ...formData, material });
        console.log("Material seleccionado:", material);
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        console.log("Select:", name, value);
    };

    const handleConfirmarIdentidad = () => {
        console.log("Confirmar identidad");
    };

    const handleSubmit = () => {
        console.log("Formulario enviado:", formData);
    };

    return (
        <div>
            {/* Botón Atrás */}
            <div className="mb-10">
                <Button variant="secondary" size="sm">
                    Atrás
                </Button>
            </div>

            {/* Contenedor verde principal */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-10 rounded-4xl">

                {/* Título con ícono */}
                <div className="mb-8 max-w-max flex items-center gap-3">
                    <LoanIcon className="w-10 h-10 text-green-700" />

                    <div>
                        <h1 className="text-gradient-title text-2xl pb-0.5">
                            Nuevo préstamo
                        </h1>
                        {/* Línea degradada del título */}
                        <div className="h-0.5 bg-gradiant-title-line" />
                    </div>
                </div>

                {/* Layout de dos columnas divididas por línea vertical */}
                <div className="grid grid-cols-2 gap-10">

                    {/* ─── Columna izquierda: Pasos 1, 2, 3 ─── */}
                    <div className="flex flex-col gap-8 pr-10 border-r border-green-400">

                        {/* Paso 1 — Selecciona los materiales */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <StepBadge number={1} />
                                <span className="font-semibold text-gray-800">
                                    Selecciona los materiales
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant={formData.material === "devolutivo" ? "outline" : "primary"}
                                    size="sm"
                                    onClick={() => handleMaterialSelect("devolutivo")}
                                >
                                    ⊕ Devolutivo
                                </Button>
                                <Button
                                    variant={formData.material === "consumible" ? "outline" : "primary"}
                                    size="sm"
                                    onClick={() => handleMaterialSelect("consumible")}
                                >
                                    ⊕ Consumible
                                </Button>
                            </div>
                        </div>

                        {/* Paso 2 — Selecciona usuario solicitante */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <StepBadge number={2} />
                                <span className="font-semibold text-gray-800">
                                    Selecciona usuario solicitante
                                </span>
                            </div>

                            <select
                                name="usuarioSolicitante"
                                value={formData.usuarioSolicitante}
                                onChange={handleSelectChange}
                                className="
                                    w-55 h-14
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
                                <option value="" disabled>
                                    Seleccione Usuario ▾
                                </option>
                                {/* Aquí puedes mapear los usuarios dinámicamente */}
                                <option value="usuario1">Usuario 1</option>
                                <option value="usuario2">Usuario 2</option>
                            </select>
                        </div>

                        {/* Paso 3 — Usuario prestador */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <StepBadge number={3} />
                                <span className="font-semibold text-gray-800">
                                    Usuario prestador
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Input deshabilitado con el nombre del prestador */}
                                <input
                                    type="text"
                                    value="PEPITO PEREZ"
                                    disabled
                                    className="
                                        w-50 h-14
                                        rounded-2xl
                                        border-2 border-input-border
                                        px-4
                                        text-text-primary
                                        bg-gray-300
                                        cursor-not-allowed
                                        font-medium
                                    "
                                />

                                {/* Botón Confirmar identidad con huella */}
                                <button
                                    type="button"
                                    onClick={handleConfirmarIdentidad}
                                    className="
                                        inline-flex items-center justify-center gap-2
                                        h-14 px-4
                                        rounded-2xl
                                        bg-linear-to-r from-blue-400 to-purple-500
                                        text-white text-sm font-medium
                                        hover:opacity-90
                                        transition-opacity duration-200
                                        whitespace-nowrap
                                    "
                                >
                                    <FingerprintIcon className="w-5 h-5" />
                                    Confirmar
                                    <br />
                                    identidad
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ─── Columna derecha: Paso 4 ─── */}
                    <div className="flex flex-col gap-6 pl-4">

                        {/* Encabezado paso 4 */}
                        <div className="flex items-center gap-2">
                            <StepBadge number={4} />
                            <span className="font-semibold text-gray-800">
                                Ingresar los siguientes datos:
                            </span>
                        </div>

                        {/* Inputs del paso 4 */}
                        <div className="flex flex-col gap-4">
                            <Input
                                placeholder="Grupo aprendices"
                                name="grupoAprendices"
                                onBlur={handleBlur}
                            />
                            <Input
                                placeholder="Fecha salida"
                                type="date"
                                name="fechaSalida"
                                onBlur={handleBlur}
                            />
                            <Input
                                placeholder="Justificación de uso"
                                name="justificacion"
                                onBlur={handleBlur}
                            />
                            <Input
                                placeholder="Fecha de entrega"
                                type="date"
                                name="fechaEntrega"
                                onBlur={handleBlur}
                            />

                            {/* Select Tipo de préstamo */}
                            <select
                                name="tipoPrestamo"
                                value={formData.tipoPrestamo}
                                onChange={handleSelectChange}
                                className="
                                    w-[320px] h-14
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
                                <option value="" disabled>
                                    Tipo de préstamo ▾
                                </option>
                                <option value="corto">Corto plazo</option>
                                <option value="largo">Largo plazo</option>
                            </select>
                        </div>

                        {/* Botón Crear */}
                        <div className="flex justify-end mt-4">
                            <IconButton
                                variant="primary"
                                size="md"
                                onClick={handleSubmit}
                            >
                                Crear
                            </IconButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Subcomponente interno: círculo numerado
───────────────────────────────────────── */
function StepBadge({ number }) {
    return (
        <span
            className="
                inline-flex items-center justify-center
                w-7 h-7
                rounded-full
                border-2 border-green-600
                text-green-700
                text-sm font-bold
                shrink-0
            "
        >
            {number}
        </span>
    );
}
