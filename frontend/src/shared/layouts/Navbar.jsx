import { Drill, ClipboardList, Router, ToolCase, Cable, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Button } from "@/shared";
import { logout } from "@/features/auth/services/logoutService.js";
import { Alert } from "@/shared";
import ReportLoanModal from "@/features/loans/reports/components/ReportLoanModal";
import { ReportConfigModal as ReportConsumableModal } from "@/features/consumable-material/reports/components/ReportConfigModal";
import { ReportConfigModal as ReportReturnableModal } from "@/features/returnable-material/reports/components/ReportConfigModal";

export default function Navbar( { isOpen, onClose }){
    const navigate = useNavigate()
    const [loanReportOpen, setLoanReportOpen] = useState(false)
    const [consumableReportOpen, setConsumableReportOpen] = useState(false)
    const [returnableReportOpen, setReturnableReportOpen] = useState(false)
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

                        {/* boton co icono de préstamo */}
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
                                    <DropdownItem>
                                <Link to="loan-create" className="block w-full">
                                            Crear préstamo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="loan-list" className="block w-full">
                                            Listar préstamo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <button className="block w-full text-left" onClick={() => setLoanReportOpen(true)}>
                                            Generar reporte de préstamo
                                        </button>
                                    </DropdownItem>
                                    

                                </DropdownContent>
                            </Dropdown>
                        </div>
                        {/* Boton de material devolutivo */}
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
                                    <DropdownItem>
                                <Link to="returnable-material-create" className="block w-full">
                                            Crear material devolutivo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                <Link to="returnable-material-list" className="block w-full">
                                            Listar material devolutivo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <button className="block w-full text-left" onClick={() => setReturnableReportOpen(true)}>
                                            Generar reporte material devolutivo
                                        </button>
                                    </DropdownItem>

                                </DropdownContent>
                            </Dropdown>
                        </div>
                        {/* Boton de material de consumo */}
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
                                    <DropdownItem>
                                        <Link to="consumable-material-create" className="block w-full">
                                            Crear material de consumo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="consumable-material-list" className="block w-full">
                                            Listar material de consumo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <button className="block w-full text-left" onClick={() => setConsumableReportOpen(true)}>
                                            Generar reporte material de consumo
                                        </button>
                                    </DropdownItem>
                                </DropdownContent>
                            </Dropdown>
                        </div>
                        {/* Boton de configuración */}
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
                                    <DropdownItem>
                                        <Link to="brand-list" className="block w-full">
                                            Gestión de marcas
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="permissions-list" className="block w-full">
                                            Gestión de permisos
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="task-create" className="block w-full">
                                            Gestión de tareas
                                        </Link>
                                    </DropdownItem>

                                </DropdownContent>
                            </Dropdown>
                        </div>
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
        </>
    )
}