// Iconos usados en los botones de acciones
import { Pencil, EllipsisVertical, Menu } from "lucide-react";


// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate, Link } from "react-router-dom";
import {
    Dropdown,
    IconButton,
    DropdownContent,
    DropdownTrigger,
    DropdownItem
    }  from "@/shared"


// Componente que renderiza las acciones de cada fila de usuario
// Recibe como prop el objeto user
export default function UserRowActions({ user }) {


  // const handleEdit = () => {
  //   console.log("Editar usuario", user.id);
  // };


  // Hook que permite redirigir a otra ruta desde código
  const navigate = useNavigate();


  // Acción para editar el usuario
  // Redirige a la página de edición usando el id del usuario
  const handleEdit = () => {
    navigate(`/users/${user.id}/edit`);
  };


  // Acción para eliminar el usuario
  // Actualmente solo imprime en consola el id
  // En una aplicación real aquí se llamaría a la API
  const handleDelete = () => {
    console.log("Eliminar usuario", user.id);
  };


  return (
    // Contenedor de los botones de acciones
    <div className="flex gap-2">


      {/* Botón editar */}
      <button
        onClick={handleEdit} // Ejecuta la navegación a la página de edición
        className="p-1 rounded hover:bg-gray-100"
      >
        <Pencil size={16} /> {/* Icono de editar */}
      </button>


      {/* Botón eliminar */}
      <button
        onClick={handleDelete} // Ejecuta la acción de eliminación
        className="p-1 rounded hover:bg-gray-100"
      >
        <div className="p-1">
            <Dropdown>
                <DropdownTrigger>
                  <IconButton ariaLabel="Más opciones">
                      <EllipsisVertical size={16} />
                  </IconButton>
                </DropdownTrigger>

                <DropdownContent className="w-48">
                  <DropdownItem>
                      <Link to="" className="block">
                        Opcion 1
                      </Link>
                  </DropdownItem>

                  <DropdownItem>
                      <Link to="" className="block">
                        Opcion 2
                      </Link>
                  </DropdownItem>

                  <DropdownItem>
                      <Link to="" className="block">
                        Opcion 3
                      </Link>
                  </DropdownItem>

                </DropdownContent>
            </Dropdown>
         </div>

      </button>


    </div>
  );
}
