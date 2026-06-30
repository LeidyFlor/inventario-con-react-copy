import { IconButton, Button } from "@/shared";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Modal que se abre desde el botón de ver tarea en ViewUserPage
// Muestra las tareas del usuario una por una, con paginacion de flechas
// igual al patron usado en TaskForm para las cards
export default function TaskViewModal({ tasks = [], onClose }) {
    // indice de la tarea que se está mostrando actualmente
    const [currentIndex, setCurrentIndex] = useState(0);

    const totalTasks = tasks.length;
    const currentTask = tasks[currentIndex];

    // Formatea fecha ISO a DD/MM/AAAA, igual que en TaskForm
    const formatDate = (iso) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("es-CO", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });
    };

    return (
        <div className="bg-background border-4 border-border-green-container p-6 rounded-4xl w-full max-w-md">

            {currentTask ? (
                <>
                    {/* Datos principales de la tarea, en filas etiqueta y valor */}
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
                            {/* Scroll interno acotado para no agrandar el modal si la descripción es muy larga */}
                            <p className="text-small h-32 overflow-y-auto">
                                {currentTask.taskDescription}
                            </p>
                        </div>
                    </div>

                    {/* Paginacion con flechas, solo se muestra si el usuario tiene mas de una tarea */}
                    <div className="flex items-center justify-between mt-6">
                        {totalTasks > 1 ? (
                            <div className="flex items-center gap-3">
                                {/* Boton tarea anterior, se deshabilita en la primera */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentIndex((i) => i - 1)}
                                    disabled={currentIndex === 0}
                                    className="p-1 rounded-full text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
                                >
                                    <ChevronLeft />
                                </button>

                                <span className="text-small text-text-muted">
                                    {currentIndex + 1} / {totalTasks}
                                </span>

                                {/* Botón tarea siguiente; deshabilitado en la última */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentIndex((i) => i + 1)}
                                    disabled={currentIndex === totalTasks - 1}
                                    className="p-1 rounded-full text-brand disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-50 transition-colors"
                                >
                                    <ChevronRight />
                                </button>
                            </div>
                        ) : (
                            // div vacio para que el botón Aceptar quede alineado a la derecha
                            // incluso cuando no hay paginacion que mostrar
                            <div />
                        )}

                        <IconButton
                            variant="primary"
                            size="md"
                            type="button"
                            onClick={onClose}
                        >
                            Aceptar
                        </IconButton>
                    </div>
                </>
            ) : (
                // Si no hay tareas se muestra un mensaje y solo el boton de cerrar
                <div className="flex flex-col items-center gap-4">
                    <p className="text-text-muted text-center">Este usuario no tiene tareas asignadas</p>
                    <IconButton
                        variant="primary"
                        size="md"
                        type="button"
                        onClick={onClose}
                    >
                        Ok
                    </IconButton>
                </div>
            )}
        </div>
    );
}
