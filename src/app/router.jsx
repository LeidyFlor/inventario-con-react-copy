import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import { CreateUserPage, EditUserPage, ListUserPage, ViewUserPage } from "@/features/users";
import { CreateBrandPage, ListBrandPage } from "@/features/brands";
import { CreateLoanPage, ReturnLoan, ApproveReturnLoan, ListLoanPage, ViewLoanPage, LoanEditPage } from "@/features/loans";
import { CreateTaskPage } from "@/features/tasks";
import { CreateConsumablePage, ListMaterialPage, ViewMaterialPage , EditConsumablePage} from "@/features/consumable-material";
import { CreateReturnablePage, EditReturnablePage, ListReturnablePage, ViewReturnablePage } from "@/features/returnable-material";
import { ListPermissionsPage } from "@/features/permissions";
import { LoginForm, LoginRestorePassword, LoginRestorePasswordCode, LoginRestoreNewPassword } from "@/features/auth";
import { AuthLayout, DashboardLayout } from "@/shared/";
import { HomePage } from "@/features/home";


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
            { index: true, element: <HomePage /> },
            { path: "auth", element: <LoginForm /> },
            { path: "user-create", element: <CreateUserPage /> },
            { path: "user-list", element: <ListUserPage /> }, 
            { path: "users/:id/edit", element: <EditUserPage /> },
            { path: "users/:id/view", element: <ViewUserPage /> }, 
            { path: "consumable-material-create", element: <CreateConsumablePage /> },
            { path: "consumable-material-list", element: <ListMaterialPage /> },
            { path: "consumable-materials/:id/edit", element: <EditConsumablePage/> },
            { path: "returnable-material-create", element: <CreateReturnablePage /> },
            { path: "returnable-material-list", element: <ListReturnablePage /> },
            { path: "returnable-materials/:id/view", element: <ViewReturnablePage /> },
            { path: "returnable-materials/:id/edit", element: <EditReturnablePage/> },
            { path: "consumable-material-create", element: <CreateConsumablePage /> },
            { path: "consumable-material-list", element: <ListMaterialPage /> }, 
            { path: "materials/:id/view", element: <ViewMaterialPage/> },
            



            { path: "loan-create", element: <CreateLoanPage /> },
            { path: "loan-list", element: <ListLoanPage /> },
            { path: "loans/:id/edit", element: <LoanEditPage /> },
            { path: "loans/:id/view", element: <ViewLoanPage /> },
            { path: "loan-return", element: <ReturnLoan /> },
            { path: "loan-acept-return", element: <h1>Aceptar retono loan</h1> },
            { path: "permissions-list", element: <ListPermissionsPage /> },
            { path: "brand-create", element: <CreateBrandPage /> },
            { path: "brand-list", element: <ListBrandPage /> },
            { path: "brand-edit", element: <h1>Editar marca</h1> },
            { path: "task-create", element: <CreateTaskPage /> },
            { path: "task-list", element: <h1>Listar tareas</h1> },
            { path: "task-edit", element: <h1>Editar tarea</h1> },
            { path: "task-view", element: <h1>Modal ver tarea</h1> },
            { path: "group-create", element: <h1>modal Crear grupo</h1> },
            { path: "group-select", element: <h1>Listar grupo (secciones ajenas a grupos)</h1> },
            { path: "group-edit", element: <h1>Editar grupo</h1> },

        ],
    }
]);

export default router;