import { Outlet } from "react-router-dom";
import { CreateUserPage } from "@/features/users";
import { CloudBackup } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IconButton, Navbar, Button, Header } from "@/shared"
import { LoginForm } from "@/features/auth";
import { useState } from "react";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <div className="relative min-h-screen text-text-primary overflow-hidden bg-background">

            <div className=" top-20 left-2 lg:left-34 absolute w-fit h-fit z-5">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(-1)}
                >
                    Atrás
                </Button>

            </div>
            
            <Header onMenuToggle={() => setMenuOpen(prev => !prev)} />
            {/* Overlay — solo en móvil, captura click afuera */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-10 lg:hidden"
                    onClick={() => setMenuOpen(false)}
                />
            )}
            <Navbar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            {/* Contenido dinamico de las paginas */}
            <main className="lg:ml-[124px] items-center lg:justify-center min-h-[calc(100vh-72px)] pt-12 px-4">

                <Outlet />

            </main>

        </div>
    )
}