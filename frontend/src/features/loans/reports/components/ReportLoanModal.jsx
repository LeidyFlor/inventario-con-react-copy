// Hook para manejo de estado local en componentes funcionales
import { useState } from "react";

// Configuración de campos disponibles para el reporte
import { loanReportFields } from "../config/loanReportFields";

// Caso de uso que orquesta la generación del reporte
import { generateLoanReport } from "../services/generateLoanReport";

// Componentes UI reutilizables (design system)
import { Button, Input, Select, Checkbox } from "@/shared";

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

    if (!isOpen) return null;

    const handleFieldToggle = (field) => {
        const exists = selectedFields.find((f) => f.key === field.key);
        if (exists) {
            setSelectedFields(selectedFields.filter((f) => f.key !== field.key));
        } else {
            setSelectedFields([...selectedFields, field]);
        }
    };

    const handleGenerateReport = () => {
        // Validación explícita: si el usuario no seleccionó formato, se le avisa.
        // Esto cubre el caso de presionar "Generar reporte" con el placeholder activo.
        if (!format) {
            alert("Por favor selecciona un formato (PDF o Excel) antes de generar el reporte.");
            return;
        }

        generateLoanReport({
            format,
            selectedFields,
            scope,
            loanStudentsGroup,
            loanUserRequester,
        });

        onClose();
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
