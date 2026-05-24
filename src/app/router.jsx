import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import { CreateUserPage, EditUserPage, ListUserPage } from "@/features/users";
import { CreteBrandPage } from "@/features/brands";
import { CreateLoanPage, ReturnLoan, ApproveReturnLoan } from "@/features/loans";
import { CreateTaskPage } from "@/features/tasks";
import { CreateConsumablePage, EditConsumablePage, ListMaterialPage } from "@/features/consumable-material";
import { CreateReturnablePage, EditReturnablePage } from "@/features/returnable-material";
import { LoginForm, LoginRestorePassword, LoginRestorePasswordCode, LoginRestoreNewPassword } from "@/features/auth";
import { AuthLayout, DashboardLayout } from "@/shared/";

const router = createBrowserRouter([
    {
        path: "/",
        //Por defecto lleva al auth
        element: <Navigate to="/auth" replace />,
    },
    {
        path: "/auth",
        element: <AuthLayout />,
        children: [
            { index: true, element: <LoginForm/> },
            { path: "restore", element: <LoginRestorePassword /> },
            { path: "code", element: <LoginRestorePasswordCode /> },
            { path: "newpassword", element: <LoginRestoreNewPassword /> },
        ],
    },
    {
        path: "/dashboard",
        element: <DashboardLayout />,
        // Nested Routes
        children: [
            { index: true, element: <CreateUserPage /> },
            { path: "auth", element: <LoginForm /> },
            { path: "user-create", element: <CreateUserPage /> },
            { path: "user-edit", element: <EditUserPage /> },
            { path: "user-list", element: <ListUserPage /> },
            { path: "loan-return", element: <ReturnLoan /> },
            { path: "returnable-material-create", element: <CreateReturnablePage /> },
            { path: "consumable-material-create", element: <CreateConsumablePage /> },
            { path: "consumable-material-list", element: <ListMaterialPage /> },
        ],
    }
]);

export default router;