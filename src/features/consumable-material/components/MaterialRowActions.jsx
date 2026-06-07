// Iconos usados en los botones de acciones
import { Pencil, Eye, Menu } from "lucide-react";


// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate, Link } from "react-router-dom";
import {
    Dropdown,
    IconButtonReal,
    DropdownContent,
    DropdownTrigger,
    DropdownItem
    }  from "@/shared"


// Componente que renderiza las acciones de cada fila de usuario
// Recibe como prop el objeto user
export default function MaterialRowActions({ material }) {


  // const handleEdit = () => {
  //   console.log("Editar usuario", user.id);
  // };


  // Hook que permite redirigir a otra ruta desde código
  const navigate = useNavigate();


  // Acción para editar el usuario
  // Redirige a la página de edición usando el id del usuario
  const handleEdit = () => {
    navigate(`/materials/${material.id}/edit`);
  };

   const handleView = () => {
    navigate(`/dashboard/materials/${material.id}/view`);
  };


  // Acción para eliminar el usuario
  // Actualmente solo imprime en consola el id
  // En una aplicación real aquí se llamaría a la API
  const handleDelete = () => {
    console.log("Eliminar material", material.id);
  };


  return (
    // Contenedor de los botones de acciones
    <div className="flex gap-2">

      {/* Botón editar */}
      <IconButtonReal
        onClick={handleEdit} // Ejecuta la navegación a la página de edición
        variant="outline"
      >
        <Pencil size={20} /> {/* Icono de editar */}
      </IconButtonReal>

      {/* Botón Visualizar */}
      <IconButtonReal
        onClick={handleView} // Ejecuta la navegación a la página de visualizar
        variant="outline"
      >
        <Eye size={20} /> {/* Icono de visualizar */}
      </IconButtonReal>

    </div>
  );
}
