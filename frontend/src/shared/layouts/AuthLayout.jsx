import { Outlet } from "react-router-dom";
import authBg from "@/assets/images/auth-bg.jpg";
import authBgMobil from "@/assets/images/auth-bg-mobil.png";
import authBgTablet from "@/assets/images/auth-bg-tablet.png";
import { CreateUserPage } from "@/features/users";
import { LoginForm } from "@/features/auth";

export default function AuthLayout() {
    return (
        <div className="relative min-h-screen text-text-primary">
            {/* Fondo con imagen */}
            <div className="absolute inset-0 -z-10">
                {/* Móvil */}
                <div className="block md:hidden absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${authBgMobil})` }}
                />
                {/* Tablet */}
                <div className="hidden md:block lg:hidden absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${authBgTablet})` }}
                />
                {/* Desktop */}
                <div className="hidden lg:block absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${authBg})` }}
                />
            </div>
            {/* outlet inyecta los elemntos hijos de las routes */}
            <main>

                <Outlet />
            </main>

        </div>
    )
}