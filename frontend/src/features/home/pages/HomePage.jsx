import { Carousel } from "@/shared";
import { useLogoutOnBack } from "@/features/auth/hooks/useLogoutOnBack";

export default function HomePage() {
    // Dar "atrás" desde el inicio equivale a cerrar sesión: se borra el token del navegador y el registrado en la base de datos, y se vuelve al login.
    useLogoutOnBack();

    return (
        <div className="mx-auto max-w-7xl">
            {/* Hero */}
            {/* Carrusel */}
            {/* Titulo */}
            <h2 className="text-h1 place-self-center mb-5 font-bold">
                Sistema de gestión de inventario SIGI
            </h2>
            <Carousel />
        </div>

    )
}
