import { Drill, ClipboardList, Router, ToolCase, Cable, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Button } from "@/shared";

export default function Navbar( { isOpen, onClose }){
    return(
        <nav className={`
            fixed 
            lg:absolute    /* sale del flujo normal en lg para no empujar el main */  
            lg:h-full
            w-fit
            z-20
            bg-gradient-side-navbar
            transition-transform duration-300
            ${isOpen ? "translate-x-0" : "-translate-x-full"}  /* drawer en móvil */
            lg:translate-x-0          /* siempre visible en lg */
        `}>

                    {/* Seleccion asidebar */}
                    <div className="flex flex-col lg:h-full place-items-center gap-4 px-4 my-4 lg:my-0 lg:justify-center">
                        {/* sm:block cuando el tamano de pantalla sea menor a 640 se escconda el buscar */}
                        
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
                                        <Link to="/auth" className="block w-full">
                                            Generar reporte de préstamo
                                        </Link>
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
                                        <Link to="/auth" className="block w-full">
                                            Generar reporte material devolutivo
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="returnable-material-edit" className="block w-full">
                                            Editar material
                                        </Link>
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
                                        <Link to="/auth" className="block w-full">
                                            Generar reporte material de consumo
                                        </Link>
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
                                        <Link to="/auth" className="block w-full">
                                            Gestión de tareas
                                        </Link>
                                    </DropdownItem>

                                </DropdownContent>
                            </Dropdown>
                        </div>
                            <div className="">
                                <Link to="/auth">
                                    <IconButtonReal className="py-8 px-8" hitSize="50" label="Cerrar sesión" arialLabel="Menu de configuración" variant="primary" >
                                        <LogOut />

                                    </IconButtonReal>
                                </Link>

                            </div>
                    </div>

        </nav>
    )
}