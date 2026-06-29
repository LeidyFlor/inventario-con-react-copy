import { useState, useEffect } from "react";
import { loanReportFields } from "../config/loanReportFields";
import { generateLoanReport } from "../services/generateLoanReport";
import { Button, Input, Select, Checkbox } from "@/shared";
import { Alert } from "@/shared/components/utils/alert";

// Componente modal para configuración de reportes de préstamos
export default function ReportLoanModal({ isOpen, onClose }) {
    // Se usa "" como valor inicial para que el Select muestre el placeholder
    // nativo del componente compartido ("Seleccione una opcion").
    // La validación en handleGenerateReport impide generar sin seleccionar.
    const [format, setFormat] = useState("");

    const [scope, setScope] = useState("all");
    const [loanStudentsGroup, setLoanStudentsGroup] = useState("");
    const [loanUserRequester, setLoanUserRequester] = useState("");

    const [selectedFields, setSelectedFields] = useState(
        () => loanReportFields.filter((f) => f.default),
    );

    // Resetea el estado cada vez que el modal se abre, evitando
    // estados "sucios" entre sesiones o recargas en caliente de Vite
    useEffect(() => {
        if (isOpen) {
            setFormat("");
            setScope("all");
            setLoanStudentsGroup("");
            setLoanUserRequester("");
            setSelectedFields(loanReportFields.filter((f) => f.default));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFieldToggle = (field) => {
        const exists = selectedFields.find((f) => f.key === field.key);
        if (exists) {
            setSelectedFields(selectedFields.filter((f) => f.key !== field.key));
        } else {
            setSelectedFields([...selectedFields, field]);
        }
    };

    const handleGenerateReport = async () => {
        if (!format) {
            Alert.error("Formato requerido", "Selecciona un formato (PDF o Excel) antes de generar el reporte.");
            return;
        }
        if (selectedFields.length === 0) {
            Alert.error("Campos requeridos", "Selecciona al menos un campo para el reporte.");
            return;
        }

        try {
            Alert.loading("Generando reporte...");
            await generateLoanReport({
                format,
                selectedFields,
                scope,
                loanStudentsGroup,
                loanUserRequester,
            });
            Alert.close();
            await Alert.success("Reporte generado", "El archivo fue descargado correctamente.");
            onClose();
        } catch (err) {
            Alert.close();
            if (err.message === "sin_datos") {
                Alert.error("Sin datos", "No hay préstamos que coincidan con los filtros seleccionados.");
            } else {
                Alert.error("Error", "No se pudo generar el reporte. Intenta de nuevo.");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-lg">
                <h2 className="mb-6 text-xl font-semibold">
                    Generar reporte de préstamos
                </h2>

                {/* Selección de formato */}
                <div className="mb-4">
                    <Select
                        label="Formato del reporte"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        options={[
                            { label: "PDF",   value: "pdf"   },
                            { label: "Excel", value: "excel" },
                        ]}
                    />
                </div>

                {/* Selección de campos */}
                <div className="mb-4">
                    <p className="mb-2 font-medium">Campos del reporte</p>
                    <div className="grid grid-cols-2 gap-2">
                        {loanReportFields.map((field) => {
                            const checked = selectedFields.some((f) => f.key === field.key);
                            return (
                                <Checkbox
                                    key={field.key}
                                    id={field.key}
                                    name={field.key}
                                    label={field.label}
                                    checked={checked}
                                    onChange={() => handleFieldToggle(field)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Selección de alcance */}
                <div className="mb-4">
                    <Select
                        label="Alcance del reporte"
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        options={[
                            { label: "Todos los préstamos",     value: "all"       },
                            { label: "Filtrar por ficha/grupo", value: "group"     },
                            { label: "Filtrar por solicitante", value: "requester" },
                        ]}
                    />
                </div>

                {scope === "group" && (
                    <div className="mb-4">
                        <Input
                            label="Ficha / Grupo"
                            value={loanStudentsGroup}
                            onChange={(e) => setLoanStudentsGroup(e.target.value)}
                            placeholder="Ingrese número de ficha/grupo"
                        />
                    </div>
                )}

                {scope === "requester" && (
                    <div className="mb-4">
                        <Input
                            label="Nombre del solicitante"
                            value={loanUserRequester}
                            onChange={(e) => setLoanUserRequester(e.target.value)}
                            placeholder="Ingrese el nombre del solicitante"
                        />
                    </div>
                )}

                <div className="flex justify-between gap-2 mt-6">
                    <Button variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleGenerateReport}>
                        Generar reporte
                    </Button>
                </div>
            </div>
        </div>
    );
}
