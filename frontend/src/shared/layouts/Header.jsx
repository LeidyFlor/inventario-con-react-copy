import { CircleUserRound, Search, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Button, SearchField } from "@/shared";
import { logout } from "@/features/auth/services/logoutService.js";
import { Alert } from "@/shared";
import logoSenaBlanco from "@/assets/images/logo-sena-blanco.png";
import logoSigiBlanco from "@/assets/images/sigi-blanco.png";

export default function Header( { onMenuToggle } ) {
    //Componente de busqueda. para detectar un cambio cuando cambie
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    //UseState del icono Serch en mobil y su usestate 👀🔎
    const [searchOpen, setSearchOpen] = useState(false); //Estado si se da click en el icono 🔎 en 📱
    const searchRef = useRef(null); // 👈 referencia al contenedor
    // Detecta clic afuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            // verifica si esta conectado a un elemnto del DOM
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false); // 👈 cierra si el clic fue afuera
            }
        };
        //Solo registra el listener cuando la barra esta abierta.
        //mmousedown cuando se da click, es + rapido (click -> presionar y solar)
        if (searchOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Limpia el listener cuando se cierra o desmonta
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchOpen]);
    
    //UseState del icono MENU en mobil y su usestate 👀
    const [menuOpen, setmenuOpen] = useState(false); //Estado si se da click en el icono 🍔 en 📱
    const menuRef = useRef(null); // 👈 referencia al contenedor
    // Detecta clic afuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            // verifica si esta conectado a un elemnto del DOM
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setmenuOpen(false); // 👈 cierra si el clic fue afuera
            }
        };
        //Solo registra el listener cuando la barra esta abierta.
        //mmousedown cuando se da click, es + rapido (click -> presionar y solar)
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Limpia el listener cuando se cierra o desmonta
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const handleSearch = (value) => {
        console.log("Buscar:", value);
    };

    const handleClear = () => {
        console.log("Campo limpiado");
    };
    // handle de logout
    const handleLogOut = async () => {
        const result = await Alert.confirm("Cierre de sesión", "¿Está seguro que desea cerrar sesión?")
        if (result.isConfirmed) {
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

    return (
        // Se agrega fixed al header para que no quede el espacio del navbar al hacer scroll, el main debe de conocer el tamano del header para dejar este espacio
        <header className="fixed top-0 left-0 right-0 z-30 w-full bg-gradient-navbar border-b-2 border-border-navbar">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-18 items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to={"/dashboard"} className="">
                            <img src={logoSenaBlanco} alt="Logo del sena" className="md:h-12  h-10" />
                        </Link>
                        <div className="rounded-2xl w-0.5 bg-background text-text-inverse hidden md:block">
                            .
                        </div>
                        <Link to={"/dashboard"} className="hidden md:block">
                            <img src={logoSigiBlanco} alt="Logo del sistema ,Sigi" className="h-13" />
                        </Link>

                        <IconButtonReal as="div" className={`lg:hidden`}
                            onClick={onMenuToggle} arialLabel="Ícono buscar"variant="primary">

                                <Menu />

                        </IconButtonReal>
                    </div>

                    {/* Seccion de la derecha: busqueda + usuario */}
                    <div className="flex items-center  h-fit">
                        {/* Solo se muestra en mobil */}
                        <div ref={searchRef} className="flex items-center">
                            <button
                                type="button"
                                className={`md:hidden ${searchOpen ? "hidden" : "flex"}`}
                                onClick={() => setSearchOpen(!searchOpen)}
                            >
                                <IconButtonReal as="div" label="Buscar" arialLabel="Ícono buscar" variant="primary">

                                    <Search />

                                </IconButtonReal>
                            
                            </button>

                            {/* SearchField: en mobile depende del estado, en md+ siempre visible */}
                            <div className={`${searchOpen ? "flex" : "hidden"} md:flex`}>
                                <SearchField
                                    value={search}
                                    onChange={setSearch}
                                    onSubmit={handleSearch}
                                    onClear={handleClear}
                                    placeholder="Buscar préstamo..."
                                    size="md"
                                    variant="filled"
                                    className="md:w-80"
                                />
                            </div>

                        </div>
                        {/* Icono de usuario */}
                        <div className="p-10">
                            <Dropdown>
                                <DropdownTrigger>
                                    <IconButtonReal label="Usuario" arialLabel="Menu de usuario" variant="primary">

                                        <CircleUserRound />

                                    </IconButtonReal>
                                </DropdownTrigger>

                                <DropdownContent className="right-0 w-48">
                                    <DropdownItem>
                                        <Link to="user-create" className="block w-full">
                                            Crear Usuario
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem>
                                        <Link to="user-list" className="block w-full">
                                            Gestión de Usuarios
                                        </Link>
                                    </DropdownItem>
                                    <DropdownItem onClick={handleLogOut} className="block w-full">
                                            Cerrar Sesión
                                    </DropdownItem>
                                </DropdownContent>
                            </Dropdown>
                        </div>
                    </div>

                </div>

            </div>

        </header>
    )
}