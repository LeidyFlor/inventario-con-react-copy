import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import { CreateUserPage, EditUserPage } from "@/features/users";
import { CreteBrandPage } from "@/features/brands";
import { CreateLoanPage, ReturnLoan, ApproveReturnLoan } from "@/features/loans";
import { CreateTaskPage } from "@/features/tasks";
import { CreateConsumablePage, EditConsumablePage } from "@/features/consumable-material";
import { CreateReturnablePage, EditReturnablePage } from "@/features/returnable-material";
import { LoginForm, LoginRestorePassword, LoginRestorePasswordCode, LoginRestoreNewPassword } from "@/features/auth";
import { AuthLayout, DashboardLayout } from "@/shared/";

const router = createBrowserRouter([
    {
        path: "/",
        //Por defecto me lleva al auth
        element: <Navigate to="/auth" replace />,
    },
    {
        path: "/auth",
        element: <AuthLayout />,
        children: [
            { index: true, element: <LoginForm/> },
            { path: "/auth/restore", element: <LoginRestorePassword /> },
            { path: "/auth/code", element: <LoginRestorePasswordCode /> },
            { path: "/auth/newpassword", element: <LoginRestoreNewPassword /> },
        ],
    },
    {
        path: "/dashboard",
        element: <DashboardLayout />,
        // Nested Routes
        children: [
            { index: true, element: <CreateUserPage /> },
            { path: "/dashboard/auth", element: <LoginForm /> },
            { path: "/dashboard/user-create", element: <CreateUserPage /> },
            { path: "/dashboard/user-edit", element: <EditUserPage /> },
            { path: "/dashboard/loan-return", element: <ReturnLoan /> }
        ],
    }
]);

export default router;