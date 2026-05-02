import { Outlet } from "react-router-dom";
// import heroBg from "@/assets/images/imagen-hero-freelancer.jpg";
import { CreateUserPage, EditUserPage } from "@/features/users";
import { CreteBrandPage } from "@/features/brands";
import { CreateLoanPage } from "@/features/loans";
import { CreateTaskPage } from "@/features/tasks";
import { CreateConsumablePage, EditConsumablePage } from "@/features/consumable-material";
import { CreateReturnablePage, EditReturnablePage } from "@/features/returnable-material";
import { LoginForm } from "@/features/auth";

export default function MainLayout() {
    return (
        <div className="relative min-h-screen text-text-primary">
            {/* outlet inyecta los elemntos hijos de las routes */}
            <Outlet />
            <LoginForm />
        </div>
    )
}