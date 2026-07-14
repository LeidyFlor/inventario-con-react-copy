import { IconButton, IconButtonReal } from "@/shared";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TaskViewModal({ tasks = [], onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const totalTasks = tasks.length;
    const currentTask = tasks[currentIndex];

    const formatDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("es-CO", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    };

    return (
        <div className="bg-background border-4 border-border-green-container p-6 rounded-4xl w-full max-w-md">

            {currentTask ? (
                <>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-small text-text-primary">Nombre tarea:</span>
                            <span className="text-small text-text-primary">{currentTask.taskName}</span>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-small text-text-primary">Fecha inicio tarea:</span>
                            <span className="text-small text-text-primary">{formatDate(currentTask.taskDateStart)}</span>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-small text-text-primary">Fecha fin tarea:</span>
                            <span className="text-small text-text-primary">{formatDate(currentTask.taskDateEnd)}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-small text-text-primary">Descripción de la tarea:</span>
                            <p className="text-small h-32 overflow-y-auto">
                                {currentTask.taskDescription}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        {totalTasks > 1 ? (
                            <div className="flex items-center gap-3">
                                <IconButtonReal
                                    variant="outline"
                                    arialLabel="Tarea anterior"
                                    onClick={() => setCurrentIndex((i) => i - 1)}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft />
                                </IconButtonReal>

                                <span className="text-small text-text-muted">
                                    {currentIndex + 1} / {totalTasks}
                                </span>

                                <IconButtonReal
                                    variant="outline"
                                    arialLabel="Tarea siguiente"
                                    onClick={() => setCurrentIndex((i) => i + 1)}
                                    disabled={currentIndex === totalTasks - 1}
                                >
                                    <ChevronRight />
                                </IconButtonReal>
                            </div>
                        ) : (
                            <div />
                        )}

                        <IconButton variant="primary" size="md" type="button" onClick={onClose}>
                            Aceptar
                        </IconButton>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-text-muted text-center">Este usuario no tiene tareas asignadas</p>
                    <IconButton variant="primary" size="md" type="button" onClick={onClose}>
                        Ok
                    </IconButton>
                </div>
            )}
        </div>
    );
}
