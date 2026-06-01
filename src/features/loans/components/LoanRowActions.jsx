// Iconos usados en los botones de acciones
import { Pencil, EllipsisVertical, Eye, Menu } from "lucide-react";


// Hook de React Router para navegar programáticamente entre rutas
import {  useNavigate, Link } from "react-router-dom";
import {
    Dropdown,
    IconButtonReal,
    DropdownContent,
    DropdownTrigger,
    DropdownItem
    }  from "@/shared"


// Componente que renderiza las acciones de cada fila de préstamo
// Recibe como prop el objeto user
export default function LoanRowActions({ loan }) {


  // const handleEdit = () => {
  //   console.log("Editar préstamo", user.id);
  // };

    // Hook que permite redirigir a otra ruta desde código
  const navigate = useNavigate();


  // Acción para editar el usuario
  // Redirige a la página de edición usando el id del usuario
  const handleEdit = () => {
    navigate(`/dashboard/loans/${loan.id}/edit`);
  };

  const handleView = () => {
    navigate(`/dashboard/loans/${loan.id}/view`);
  };


  return (
    // Contenedor de los botones de acciones
      <div className="flex gap-2">
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

      </div>
  );
}
