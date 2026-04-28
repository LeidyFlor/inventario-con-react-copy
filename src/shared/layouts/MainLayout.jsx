import { Outlet } from "react-router-dom";
import heroBg from "@/assets/images/imagen-hero-freelancer.jpg";
import { CreateUserPage } from "@/features/users";

export default function MainLayout() {
    return (
        <div className="relative min-h-screen text-text-primary">
            {/* Fondo con imagen */}
            <div className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroBg})` }}
            />
            {/* outlet inyecta los elemntos hijos de las routes */}
            <Outlet />
            <CreateUserPage />
        </div>
    )
}