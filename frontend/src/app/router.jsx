import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/shared/layouts/MainLayout";
import { CreateUserPage, EditUserPage, ListUserPage, ViewUserPage, MyProfilePage } from "@/features/users";
import { CreateBrandPage, ListBrandPage, EditBrandPage } from "@/features/brands";
import { ListInventoryNamePage } from "@/features/inventory-names";
import { ListCategoryPage } from "@/features/categories";
import { ListQuotationPage } from "@/features/quotations";
import { CreateLoanPage, ReturnLoan, ApproveReturnLoan, ListLoanPage, ViewLoanPage, LoanEditPage, ConfirmIdentityPage } from "@/features/loans";
import { CreateTaskPage } from "@/features/tasks";
import { ListGroupPage } from "@/features/groups";
import { CreateConsumablePage, ListMaterialPage, ViewMaterialPage , EditConsumablePage} from "@/features/consumable-material";
import { CreateReturnablePage, EditReturnablePage, ListReturnablePage, ViewReturnablePage } from "@/features/returnable-material";
import { ListPermissionsPage } from "@/features/permissions";
// RequirePerm y PERM se importan directo (no por el barril) para no arrastrar
// ListPermissionsPage → "@/shared" → DashboardLayout dentro del mismo ciclo
// de importaciones donde vive PermissionsContext.
import RequirePerm from "@/features/permissions/components/RequirePerm";
import { PERM } from "@/features/permissions/config/perms";
import { LoginForm, LoginRestorePassword, LoginRestorePasswordCode, LoginRestoreNewPassword } from "@/features/auth";
import ForcePasswordChange from "@/features/auth/components/ForcePasswordChange";
import { AuthLayout, DashboardLayout, ProtectedRoute } from "@/shared/";
import { HomePage } from "@/features/home";


// Permisos que necesita la pantalla de gestión de tareas.
// Además de crear tareas, el formulario carga los selects de usuarios y de
// grupos al montarse, así que sin esos permisos daría 403 nada más entrar.
const TASK_PERMS = [PERM.TASK_ADD, PERM.USER_LIST, PERM.GROUP_VIEW]

const router = createBrowserRouter([
    {
        path: "/",
        //Por defecto lleva al auth
        element: <Navigate to="/auth" replace />,
    },
    {
        // Página pública: el prestador llega aquí desde el link del correo de confirmación
        path: "/confirm-identity",
        element: <ConfirmIdentityPage />,
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
        element: (<ProtectedRoute>
            <DashboardLayout />
        </ProtectedRoute>) ,
        // Nested Routes 
        // Cada ruta va envuelta en RequirePerm para que no se pueda entrar
        // escribiendo la URL. Sin el permiso redirige al inicio del dashboard,
        // evitando que la página se monte y dispare peticiones que darían 403.
        children: [
            { index: true, element: <HomePage /> },
            { path: "auth", element: <LoginForm /> },

            // Cambio obligatorio del primer ingreso. Sin RequirePerm: cualquier
            // usuario autenticado tiene que poder llegar aquí, y de hecho
            // RequirePasswordChange lo obliga mientras la marca esté activa.
            { path: "change-password", element: <ForcePasswordChange /> },

            // ── Usuarios ──────────────────────────────────────────────
            // El formulario de creación carga el select de grupos al montarse
            { path: "user-create",     element: <RequirePerm allOf={[PERM.USER_ADD, PERM.GROUP_VIEW]}><CreateUserPage /></RequirePerm> },
            { path: "user-list",       element: <RequirePerm perm={PERM.USER_LIST}><ListUserPage /></RequirePerm> },
            // Igual que user-create: el formulario carga el select de grupos al
            // montarse, así que sin auth.view_group la pantalla entra y luego
            // recibe un 403 de /api/groups/
            { path: "users/:id/edit",  element: <RequirePerm allOf={[PERM.USER_CHANGE, PERM.GROUP_VIEW]}><EditUserPage /></RequirePerm> },
            { path: "users/:id/view",  element: <RequirePerm perm={PERM.USER_VIEW}><ViewUserPage /></RequirePerm> },
            // Mi perfil — accesible para cualquier usuario autenticado, sin permisos
            { path: "my-profile",      element: <MyProfilePage /> },

            // ── Material de consumo ───────────────────────────────────
            { path: "consumable-material-create",   element: <RequirePerm perm={PERM.CONSUMABLE_ADD}><CreateConsumablePage /></RequirePerm> },
            { path: "consumable-material-list",     element: <RequirePerm perm={PERM.CONSUMABLE_LIST}><ListMaterialPage /></RequirePerm> },
            { path: "consumable-materials/:id/edit",element: <RequirePerm perm={PERM.CONSUMABLE_CHANGE}><EditConsumablePage /></RequirePerm> },
            { path: "materials/:id/view",           element: <RequirePerm perm={PERM.CONSUMABLE_VIEW}><ViewMaterialPage /></RequirePerm> },

            // ── Material devolutivo ───────────────────────────────────
            { path: "returnable-material-create",    element: <RequirePerm perm={PERM.RETURNABLE_ADD}><CreateReturnablePage /></RequirePerm> },
            { path: "returnable-material-list",      element: <RequirePerm perm={PERM.RETURNABLE_LIST}><ListReturnablePage /></RequirePerm> },
            { path: "returnable-materials/:id/view", element: <RequirePerm perm={PERM.RETURNABLE_VIEW}><ViewReturnablePage /></RequirePerm> },
            { path: "returnable-materials/:id/edit", element: <RequirePerm perm={PERM.RETURNABLE_CHANGE}><EditReturnablePage /></RequirePerm> },

            // ── Préstamos ─────────────────────────────────────────────
            { path: "loan-create",              element: <RequirePerm perm={PERM.LOAN_ADD}><CreateLoanPage /></RequirePerm> },
            { path: "loan-list",                element: <RequirePerm perm={PERM.LOAN_LIST}><ListLoanPage /></RequirePerm> },
            { path: "loans/:id/edit",           element: <RequirePerm perm={PERM.LOAN_CHANGE}><LoanEditPage /></RequirePerm> },
            { path: "loans/:id/view",           element: <RequirePerm perm={PERM.LOAN_VIEW}><ViewLoanPage /></RequirePerm> },
            // Las dos cargan el préstamo con getLoan(), que exige view_loan.
            // Sin él la pantalla se monta y recibe un 403 al cargar.
            { path: "loans/:id/return",         element: <RequirePerm allOf={[PERM.LOAN_CHANGE, PERM.LOAN_VIEW]}><ReturnLoan /></RequirePerm> },
            // Aceptar el retorno lo autoriza add_loan en el backend
            { path: "loans/:id/accept-return",  element: <RequirePerm allOf={[PERM.LOAN_ADD, PERM.LOAN_VIEW]}><ApproveReturnLoan /></RequirePerm> },

            // ── Configuración ─────────────────────────────────────────
            // La gestión de permisos es exclusiva del super administrador
            { path: "permissions-list", element: <RequirePerm superuserOnly><ListPermissionsPage /></RequirePerm> },
            { path: "brand-create",     element: <RequirePerm perm={PERM.BRAND_ADD}><CreateBrandPage /></RequirePerm> },
            { path: "brand-list",       element: <RequirePerm perm={PERM.BRAND_LIST}><ListBrandPage /></RequirePerm> },
            { path: "brand-edit",       element: <RequirePerm perm={PERM.BRAND_CHANGE}><EditBrandPage /></RequirePerm> },
            { path: "group-list",       element: <RequirePerm perm={PERM.GROUP_VIEW}><ListGroupPage /></RequirePerm> },
            // Crear y editar se hacen en modales dentro del listado, igual que
            // en marcas, así que solo hace falta la ruta del listado.
            { path: "inventory-name-list", element: <RequirePerm perm={PERM.INVENTORY_NAME_LIST}><ListInventoryNamePage /></RequirePerm> },
            { path: "category-list",       element: <RequirePerm perm={PERM.CATEGORY_LIST}><ListCategoryPage /></RequirePerm> },
            { path: "quotation-list",      element: <RequirePerm perm={PERM.QUOTATION_LIST}><ListQuotationPage /></RequirePerm> },

            // ── Tareas ────────────────────────────────────────────────
            // La gestión de tareas escribe usando el permiso de edición de
            // usuarios (igual que en el backend), pero además el formulario
            // carga la lista de usuarios y de grupos para sus selects.
            // Por eso se exigen los tres permisos: sin alguno la pantalla
            // fallaría con 403 al montarse.
            { path: "task-create", element: <RequirePerm allOf={TASK_PERMS}><CreateTaskPage /></RequirePerm> },
            { path: "task-list",   element: <RequirePerm allOf={TASK_PERMS}><h1>Listar tareas</h1></RequirePerm> },
            { path: "task-edit",   element: <RequirePerm allOf={TASK_PERMS}><h1>Editar tarea</h1></RequirePerm> },
            { path: "task-view",   element: <RequirePerm allOf={TASK_PERMS}><h1>Modal ver tarea</h1></RequirePerm> },

        ],
    }
]);

export default router;