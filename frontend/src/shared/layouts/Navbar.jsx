import { Drill, ClipboardList, Router, ToolCase, Cable, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Button } from "@/shared";
import { logout } from "@/features/auth/services/logoutService.js";
import { Alert } from "@/shared";
import ReportLoanModal from "@/features/loans/reports/components/ReportLoanModal";
import { ReportConfigModal as ReportConsumableModal } from "@/features/consumable-material/reports/components/ReportConfigModal";
import { ReportConfigModal as ReportReturnableModal } from "@/features/returnable-material/reports/components/ReportConfigModal";
import LogsModal from "@/features/audit/components/LogsModal";
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM, MODULE_PERMS } from "@/features/permissions/config/perms";

export default function Navbar( { isOpen, onClose }){
    const navigate = useNavigate()
    const { hasPerm, hasAnyPerm, isSuperuser, isStaff } = usePermissions()
    const [loanReportOpen, setLoanReportOpen] = useState(false)
    const [consumableReportOpen, setConsumableReportOpen] = useState(false)
    const [returnableReportOpen, setReturnableReportOpen] = useState(false)
    const [logsOpen, setLogsOpen] = useState(false)

    // La gestión de tareas necesita los tres permisos: el formulario además de
    // guardar carga los selects de usuarios y de grupos. Con la misma condición
    // que el guard de la ruta, para no mostrar un enlace que terminaría en 403.
    const canManageTasks =
        hasPerm(PERM.TASK_ADD) && hasPerm(PERM.USER_LIST) && hasPerm(PERM.GROUP_VIEW)

    // Configuración se muestra si el usuario tiene algún permiso de marcas/grupos,
    // puede gestionar tareas, o si es superadmin (permisos) o staff (historial)
    const showConfig =
        hasAnyPerm(MODULE_PERMS.CONFIG) || canManageTasks || isSuperuser || isStaff
    // handle de logout
    const handleLogOut = async () => {
        const result = await Alert.confirm("Cierre de sesión", "¿Está seguro que desea cerrar sesión?")
        if (result.isConfirmed){
            try {
                await logout()
                navigate("/auth")
            } catch (error) {
                console.error("Error al cerrar sesión:", error)
                // Igual navegamos aunque falle el backend
                sessionStorage.removeItem("token")
                navigate("/auth")
            }
        }
    };
    return(
        <>
        <nav className={`
            fixed 
            h-full
            w-fit
            z-20
            bg-gradient-side-navbar
            transition-transform duration-300
            ${isOpen ? "translate-x-0" : "-translate-x-full"}  /* drawer en móvil */
            lg:translate-x-0          /* siempre visible en lg */
        `}>

                    {/* Seleccion asidebar */}
                    <div className="flex flex-col h-full place-items-center gap-4 px-4 my-4 justify-center">

                        {/* Módulo Préstamo — se oculta completo si no tiene ningún permiso */}
                        {hasAnyPerm(MODULE_PERMS.LOANS) && (
                        <div className="">
                            <Dropdown>
                                <DropdownTrigger>
                                    <div className="">
                                        <IconButtonReal hitSize="50" label="Préstamo" arialLabel="Menu de préstamo" variant="default" >

                                            <ClipboardList />

                                        </IconButtonReal>

                                    </div>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">
                                    {hasPerm(PERM.LOAN_ADD) && (
                                    <DropdownItem>
                                        <Link to="loan-create" className="block w-full">
                                            Crear préstamo
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.LOAN_LIST) && (
                                    <DropdownItem>
                                        <Link to="loan-list" className="block w-full">
                                            Listar préstamo
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.LOAN_REPORT) && (
                                    <DropdownItem>
                                        <button className="block w-full text-left" onClick={() => setLoanReportOpen(true)}>
                                            Generar reporte de préstamo
                                        </button>
                                    </DropdownItem>
                                    )}

                                </DropdownContent>
                            </Dropdown>
                        </div>
                        )}
                        {/* Módulo Material Devolutivo — se oculta completo si no tiene ningún permiso */}
                        {hasAnyPerm(MODULE_PERMS.RETURNABLE) && (
                        <div className="">
                            <Dropdown>
                                <DropdownTrigger>
                                    <div className="">
                                        <IconButtonReal hitSize="50" label="Material Devolutivo" arialLabel="Menu de material devolutivo" variant="default" >

                                            <Router />

                                        </IconButtonReal>

                                    </div>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">
                                    {hasPerm(PERM.RETURNABLE_ADD) && (
                                    <DropdownItem>
                                        <Link to="returnable-material-create" className="block w-full">
                                            Crear material devolutivo
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.RETURNABLE_LIST) && (
                                    <DropdownItem>
                                        <Link to="returnable-material-list" className="block w-full">
                                            Listar material devolutivo
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.RETURNABLE_REPORT) && (
                                    <DropdownItem>
                                        <button className="block w-full text-left" onClick={() => setReturnableReportOpen(true)}>
                                            Generar reporte material devolutivo
                                        </button>
                                    </DropdownItem>
                                    )}

                                </DropdownContent>
                            </Dropdown>
                        </div>
                        )}
                        {/* Módulo Material de Consumo — se oculta completo si no tiene ningún permiso */}
                        {hasAnyPerm(MODULE_PERMS.CONSUMABLE) && (
                        <div className="">
                            <Dropdown>
                                <DropdownTrigger>
                                    <div className="">
                                        <IconButtonReal hitSize="50" label="Material Consumo" arialLabel="Menu de material de consumo" variant="default" >

                                            <Cable />

                                        </IconButtonReal>

                                    </div>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">
                                    {hasPerm(PERM.CONSUMABLE_ADD) && (
                                    <DropdownItem>
                                        <Link to="consumable-material-create" className="block w-full">
                                            Crear material de consumo
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.CONSUMABLE_LIST) && (
                                    <DropdownItem>
                                        <Link to="consumable-material-list" className="block w-full">
                                            Listar material de consumo
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.CONSUMABLE_REPORT) && (
                                    <DropdownItem>
                                        <button className="block w-full text-left" onClick={() => setConsumableReportOpen(true)}>
                                            Generar reporte material de consumo
                                        </button>
                                    </DropdownItem>
                                    )}
                                </DropdownContent>
                            </Dropdown>
                        </div>
                        )}
                        {/* Módulo Configuración — se oculta si no tiene permisos de marcas/grupos,
                            no es superadmin (permisos) ni staff (historial) */}
                        {showConfig && (
                        <div className="">
                            <Dropdown>
                                <DropdownTrigger>
                                    <div className="">
                                        <IconButtonReal hitSize="50" label="Configuración" arialLabel="Menu de configuración" variant="default" >

                                            <Settings />

                                        </IconButtonReal>

                                    </div>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">
                                    {hasPerm(PERM.BRAND_LIST) && (
                                    <DropdownItem>
                                        <Link to="brand-list" className="block w-full">
                                            Gestión de marcas
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.INVENTORY_NAME_LIST) && (
                                    <DropdownItem>
                                        <Link to="inventory-name-list" className="block w-full">
                                            Gestión de nombres de inventarios
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.CATEGORY_LIST) && (
                                    <DropdownItem>
                                        <Link to="category-list" className="block w-full">
                                            Gestión de categorías
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {/* La gestión de permisos es exclusiva del super administrador */}
                                    {isSuperuser && (
                                    <DropdownItem>
                                        <Link to="permissions-list" className="block w-full">
                                            Gestión de permisos
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {canManageTasks && (
                                    <DropdownItem>
                                        <Link to="task-create" className="block w-full">
                                            Gestión de tareas
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {hasPerm(PERM.GROUP_VIEW) && (
                                    <DropdownItem>
                                        <Link to="group-list" className="block w-full">
                                            Gestión de grupos
                                        </Link>
                                    </DropdownItem>
                                    )}
                                    {/* La descarga del historial requiere is_staff (validado también en el backend) */}
                                    {(isStaff || isSuperuser) && (
                                    <DropdownItem onClick={() => setLogsOpen(true)}>
                                        Historial
                                    </DropdownItem>
                                    )}

                                </DropdownContent>
                            </Dropdown>
                        </div>
                        )}
                            <div onClick={handleLogOut}>
                                    <IconButtonReal className="py-8 px-8" hitSize="50" label="Cerrar sesión" arialLabel="Menu de configuración" variant="primary" >
                                        <LogOut />

                                    </IconButtonReal>
                            </div>
                    </div>

        </nav>

        <ReportLoanModal isOpen={loanReportOpen} onClose={() => setLoanReportOpen(false)} />
        <ReportConsumableModal isOpen={consumableReportOpen} onClose={() => setConsumableReportOpen(false)} />
        <ReportReturnableModal isOpen={returnableReportOpen} onClose={() => setReturnableReportOpen(false)} />
        <LogsModal isOpen={logsOpen} onClose={() => setLogsOpen(false)} />
        </>
    )
}