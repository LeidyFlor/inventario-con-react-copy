import { Outlet } from "react-router-dom";
import { CreateUserPage } from "@/features/users";
import { CloudBackup } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { IconButton, Navbar, Button } from "@/shared"
import { LoginForm } from "@/features/auth";

export default function DashboardLayout() {
    const navigate = useNavigate();
    return (
        <div className="relative min-h-screen text-text-primary">

            <div className="top-19 left-2 absolute w-fit h-fit z-5">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(-1)}
                >
                    Atrás
                </Button>

            </div>
            
            <Navbar />
            {/* Contenido dinamico de las paginas */}
            <main>

                <Outlet />

            </main>

        </div>
    )
}