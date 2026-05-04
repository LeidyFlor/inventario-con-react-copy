import { CircleUserRound, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared";
import  logoSenaBlanco  from "@/assets/images/logo-sena-blanco.png";
import  logoSigiBlanco  from "@/assets/images/sigi-blanco.png";

export default function Navbar(){
    return(
        <nav className="w-full bg-gradient-navbar border-b-2 border-border-navbar">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-18 items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to={"/"} className="">
                        <img src={logoSenaBlanco} alt="Logo del sena" className="h-12" />
                        </Link>
                        <div className="rounded-2xl w-0.5 bg-background text-text-inverse">
                            .
                        </div>
                        <Link to={"/"} className="">
                        <img src={logoSigiBlanco} alt="Logo del sistema ,Sigi" className="h-13" />
                        </Link>
                    </div>

                    {/* Seccion de la derecha: busqueda + usuario */}
                    <div className="flex items-center gap-5 h-fit">
                        {/* sm:block cuando el tamano de pantalla sea menor a 640 se escconda el buscar */}
                        <div className="relative hidden sm:block">
                            {/* Icono de busqueda */}
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-primary" />
                            {/* Input del buscador*/}
                            <input
                                type="text"
                                placeholder="Buscar préstamo"
                                className="pl-9 pr-4 py-2.5 border border-border-strong bg-surface rounded-lg text-body focus:outline-none focus:right-2 focus:ring-text-primary"
                            />
                        </div>
                        {/* Icono de usuario */}
                        <div className="p-10">
                            <Dropdown>
                                <DropdownTrigger>
                                    <IconButtonReal arialLabel="Menu de usuario" variant="primary">
                                        
                                        <CircleUserRound />
                                        
                                    </IconButtonReal>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">
                                    <DropdownItem>
                                        <Link to="/dashboard/user-create" className="block w-full">
                                            Crear usuario
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="/dashboard/user-edit" className="block w-full">
                                            Editar usuario
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="/auth" className="block w-full">
                                            Cerrar sesion
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="/dashboard/loan-return" className="block w-full">
                                            Retornar préstamo
                                        </Link>
                                    </DropdownItem>

                                </DropdownContent>
                            </Dropdown>
                        </div>
                    </div>

                </div>

            </div>

        </nav>
    )
}