import { Outlet } from "react-router-dom";
import authBg from "@/assets/images/auth-bg.jpg";
import { CreateUserPage } from "@/features/users";
import { LoginForm } from "@/features/auth";

export default function AuthLayout() {
    return (
        <div className="relative min-h-screen text-text-primary">
            {/* Fondo con imagen */}
            <div className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url(${authBg})` }}
            />
            {/* outlet inyecta los elemntos hijos de las routes */}
            <main>

                <Outlet />
            </main>

        </div>
    )
}