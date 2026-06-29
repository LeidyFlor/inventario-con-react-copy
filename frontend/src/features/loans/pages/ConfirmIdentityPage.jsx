import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";

/**
 * Página pública (sin login) a la que llega el prestador al abrir el link del correo.
 * Django redirige aquí tras confirmar el token: /confirm-identity?status=ok
 */
export default function ConfirmIdentityPage() {
    const [params] = useSearchParams();
    const ok = params.get("status") === "ok";

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                {ok ? (
                    <>
                        <CheckCircle className="w-16 h-16 text-brand" />
                        <h1 className="text-h3 font-bold text-text-primary">
                            Identidad confirmada
                        </h1>
                        <p className="text-text-muted text-body">
                            Tu identidad fue verificada correctamente. El solicitante puede continuar con el préstamo.
                        </p>
                    </>
                ) : (
                    <>
                        <XCircle className="w-16 h-16 text-error" />
                        <h1 className="text-h3 font-bold text-text-primary">
                            Link inválido
                        </h1>
                        <p className="text-text-muted text-body">
                            Este enlace no es válido o ya fue utilizado. Solicita un nuevo correo de confirmación.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
