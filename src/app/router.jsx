import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import { CreateUserPage, EditUserPage, ListUserPage } from "@/features/users";
import { CreateBrandPage, ListBrandPage } from "@/features/brands";
import { CreateLoanPage, ReturnLoan, ApproveReturnLoan, ListLoanPage, ViewLoanPage } from "@/features/loans";
import { CreateTaskPage } from "@/features/tasks";
import { CreateConsumablePage, EditConsumablePage, ListMaterialPage } from "@/features/consumable-material";
import { CreateReturnablePage, EditReturnablePage, ListReturnablePage } from "@/features/returnable-material";
import { ListPermissionsPage } from "@/features/permissions";
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
            { path: "permissions-list", element: <ListPermissionsPage /> },
            { path: "loan-create", element: <CreateLoanPage /> },
            { path: "loan-list", element: <ListLoanPage /> },
            { path: "loans/:id/view", element: <ViewLoanPage /> },
            { path: "returnable-material-list", element: <ListReturnablePage /> },
            { path: "returnable-material-edit", element: <EditConsumablePage /> },
            { path: "consumable-material-list", element: <ListMaterialPage /> },
            { path: "brand-create", element: <CreateBrandPage /> },
            { path: "brand-list", element: <ListBrandPage /> },

        ],
    }
]);

export default router;