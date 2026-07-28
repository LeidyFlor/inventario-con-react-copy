import { Input, Button, IconButton, Select, Textarea } from "@/shared"
import React, { useState, useEffect } from "react";
import { getUserName, getLoanTypes, getLenders } from "@/features/loans/services/selectService.js";
import { loanSchema } from "../schemas/loanSchema";
import { FilePlus2 } from "lucide-react"
import MaterialsLoan from "./MaterialsLoan";
import { createLoan, createIdentityToken, verifyToken } from "../services/loanService";
import { useNavigate } from "react-router-dom";
import { Alert } from "@/shared/components/utils/alert";

// Devuelve la fecha local actual en formato YYYY-MM-DD.
// Se usa getFullYear/Month/Date en vez de toISOString() porque toISOString()
// retorna la fecha en UTC, lo cual en Colombia (UTC-5) puede devolver
// el día siguiente a partir de las 7 PM hora local.
const localToday = () => {
    const d = new Date()
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
    ].join("-")
}

export default function NewLoanForm() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        loanUserRequester: "",
        loanUserLender:    "",
        loanStudentsGroup: "",
        loanDateOut:       "",
        loanJustification: "",
        loanDateIn:        "",
        loanType:          "",
    });
    const [errors, setErrors]               = useState({});
    const [userName, setUserName]           = useState([]);
    const [lenders, setLenders]             = useState([]);
    const [loanTypes, setLoanTypes]         = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);

    // Estado del flujo de confirmación de identidad.
    // Requiere doble confirmación: el prestador (quien entrega) y el
    // solicitante (quien recibe) deben abrir cada uno su enlace del correo.
    const [identityToken, setIdentityToken]         = useState(null)   // UUID devuelto por el backend
    const [identityConfirmed, setIdentityConfirmed] = useState(false)  // ambos confirmaron
    const [lenderConfirmed, setLenderConfirmed]       = useState(false)
    const [requesterConfirmed, setRequesterConfirmed] = useState(false)
    const [identityLoading, setIdentityLoading]     = useState(false)
    const [identityError, setIdentityError]         = useState("")

    useEffect(() => {
        getUserName().then(setUserName);
        getLoanTypes().then(setLoanTypes);
        getLenders().then(setLenders);
    }, []); //los [] es para que al menos se ejecute una vez, no tiene dependencia

    // Limpia todo el estado de confirmación. Se llama cuando cambia
    // cualquiera de las dos personas involucradas, porque el token
    // generado ya no corresponde a esa pareja.
    const resetIdentity = () => {
        setIdentityToken(null);
        setIdentityConfirmed(false);
        setLenderConfirmed(false);
        setRequesterConfirmed(false);
        setIdentityError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Si cambia el prestador o el solicitante, se reinicia la confirmación
        if (name === "loanUserLender" || name === "loanUserRequester") {
            resetIdentity();
        }
    };

    // Genera el token y envía un correo a cada parte con su propio enlace
    const handleConfirmIdentity = async () => {
        if (!formData.loanUserLender || !formData.loanUserRequester) {
            setIdentityError("Selecciona primero el usuario solicitante y el prestador.");
            return;
        }
        if (formData.loanUserLender === formData.loanUserRequester) {
            setIdentityError("El prestador y el solicitante no pueden ser la misma persona.");
            return;
        }
        setIdentityLoading(true);
        setIdentityError("");
        try {
            const res = await createIdentityToken(
                formData.loanUserLender,
                formData.loanUserRequester,
            );
            setIdentityToken(res.token);
            setIdentityConfirmed(false);
            setLenderConfirmed(false);
            setRequesterConfirmed(false);
        } catch {
            setIdentityError("No se pudieron enviar los correos de confirmación.");
        } finally {
            setIdentityLoading(false);
        }
    };

    // Consulta cuáles de las dos partes ya abrieron su enlace del correo
    const handleCheckIdentity = async () => {
        if (!identityToken) return;
        setIdentityLoading(true);
        setIdentityError("");
        try {
            const res = await verifyToken(identityToken);
            setLenderConfirmed(Boolean(res.lender_confirmed));
            setRequesterConfirmed(Boolean(res.requester_confirmed));

            if (res.is_confirmed) {
                setIdentityConfirmed(true);
            } else {
                // Mensaje concreto según quién falta, en vez de un genérico
                const faltan = [];
                if (!res.lender_confirmed)    faltan.push("el prestador");
                if (!res.requester_confirmed) faltan.push("el solicitante");
                setIdentityError(`Falta que ${faltan.join(" y ")} confirme(n) su identidad.`);
            }
        } catch {
            setIdentityError("Error al verificar la confirmación.");
        } finally {
            setIdentityLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = loanSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach((issue) => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        if (selectedMaterials.length === 0) {
            setErrors((prev) => ({ ...prev, materials: "Debes agregar al menos un material." }));
            return;
        }

        setErrors({});

        // Convierte selectedMaterials al formato que espera el backend
        const items = selectedMaterials.map((m) => ({
            material_id:     m.id,
            material_type:   m.tipo === "Devolutivo" ? "returnable" : "consumable",
            quantity_loaned: m.cantidad,
        }));

        try {
            Alert.loading("Creando préstamo...");
            await createLoan(formData, items, identityConfirmed ? identityToken : null);
            Alert.close();
            await Alert.success("Préstamo creado", "El préstamo fue registrado correctamente.");
            navigate("/dashboard/loan-list");
        } catch (err) {
            console.error("Error al crear préstamo:", err);
            Alert.close();
            Alert.error("Error al crear préstamo", "Verifica los datos e intenta de nuevo.");
            // El formulario se preserva para que el usuario pueda corregir sin perder lo ingresado
        }
    };

    return (
       <div className="flex flex-col place-items-center justify-items-center relative px-4">

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-4 md:p-5 rounded-4xl w-full max-w-4xl overflow-hidden">

                {/* Título */}
                <div className="mb-1 max-w-max">
                    <h1 className="text-gradient-title text-h3 pb-0.5 flex items-center gap-3">
                        <FilePlus2 className="text-brand"/>
                        Nuevo préstamo
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <form
                    className="flex flex-col md:flex-row gap-6 md:gap-10"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {/* Columna izquierda */}
                    <div className="flex flex-col gap-6 md:gap-0 md:justify-evenly border-b-2 md:border-b-0 md:border-r-2 pb-6 md:pb-0 md:pr-4 bg-gradiant-cian-purple-line w-full md:w-1/2 min-w-0">

                        <MaterialsLoan
                            selectedMaterials={selectedMaterials}
                            setSelectedMaterials={setSelectedMaterials}
                        />

                        {/*  Usuario solicitante */}
                        <div className="flex flex-col gap-4">
                            <h2 className="font-bold text-body">2. Selecciona usuario solicitante</h2>
                            <Select
                                name="loanUserRequester"
                                options={userName}
                                value={formData.loanUserRequester}
                                onChange={handleChange}
                                error={errors.loanUserRequester}
                            />
                        </div>

                        {/*  Usuario prestador + confirmación de identidad */}
                        <div className="flex flex-col gap-3">
                            <h2 className="font-bold text-body">3. Usuario prestador</h2>
                            <Select
                                name="loanUserLender"
                                options={lenders}
                                value={formData.loanUserLender}
                                onChange={handleChange}
                                error={errors.loanUserLender}
                            />

                            {/* Botones de identidad */}
                            <div className="flex gap-2 flex-wrap">
                                {!identityToken ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleConfirmIdentity}
                                        disabled={
                                            identityLoading ||
                                            !formData.loanUserLender ||
                                            !formData.loanUserRequester
                                        }
                                    >
                                        {identityLoading ? "Enviando..." : "Confirmar identidad"}
                                    </Button>
                                ) : identityConfirmed ? (
                                    <span className="text-sm font-semibold text-brand">
                                        ✓ Identidad confirmada por ambas partes
                                    </span>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCheckIdentity}
                                            disabled={identityLoading}
                                        >
                                            {identityLoading ? "Verificando..." : "Ya confirmamos"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleConfirmIdentity}
                                            disabled={identityLoading}
                                        >
                                            Reenviar correos
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Estado individual de cada parte, para saber quién falta */}
                            {identityToken && !identityConfirmed && (
                                <div className="flex flex-col gap-1 text-sm">
                                    <span className={lenderConfirmed ? "text-brand font-semibold" : "text-text-muted"}>
                                        {lenderConfirmed ? "✓" : "○"} Prestador
                                    </span>
                                    <span className={requesterConfirmed ? "text-brand font-semibold" : "text-text-muted"}>
                                        {requesterConfirmed ? "✓" : "○"} Solicitante
                                    </span>
                                </div>
                            )}

                            {identityError && (
                                <p className="text-sm text-red-500">{identityError}</p>
                            )}
                            {identityToken && !identityConfirmed && (
                                <p className="text-sm text-text-muted">
                                    Se envió un enlace al prestador y al solicitante. Cuando ambos lo abran, presiona "Ya confirmamos".
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="flex flex-col gap-4 w-full md:w-1/2 min-w-0">
                        <h2 className="font-bold text-body">4. Ingresar los siguientes datos:</h2>

                        <div className="flex flex-col gap-3 w-full">
                            <Input
                                placeholder="Grupo aprendices"
                                name="loanStudentsGroup"
                                label="Grupo aprendices"
                                value={formData.loanStudentsGroup}
                                onChange={handleChange}
                                error={errors.loanStudentsGroup}
                            />
                            <Textarea
                                placeholder="Justificación de uso"
                                name="loanJustification"
                                label="Justificacion de uso"
                                value={formData.loanJustification}
                                onChange={handleChange}
                                error={errors.loanJustification}
                            />
                            <Select
                                label="Tipo de préstamo"
                                name="loanType"
                                options={loanTypes}
                                value={formData.loanType}
                                onChange={handleChange}
                                error={errors.loanType}
                            />

                            <div className="flex flex-row gap-2 overflow-hidden">
                                <div className="flex-1 min-w-0 w-0">
                                    {/* min=hoy para no permitir fechas pasadas */}
                                    <Input
                                        type="date"
                                        name="loanDateOut"
                                        label="Fecha salida"
                                        value={formData.loanDateOut}
                                        onChange={handleChange}
                                        error={errors.loanDateOut}
                                        min={localToday()}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 w-0">
                                    {/* min=hoy para no permitir fechas pasadas */}
                                    <Input
                                        label="Fecha estimada de entrega"
                                        type="date"
                                        name="loanDateIn"
                                        value={formData.loanDateIn}
                                        onChange={handleChange}
                                        error={errors.loanDateIn}
                                        min={localToday()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <IconButton variant="primary" size="md" type="submit">
                                Crear
                            </IconButton>
                        </div>
                    </div>

                </form>
            </div>

        </div>
    );
}
