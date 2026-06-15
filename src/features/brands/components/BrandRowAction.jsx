// Iconos usados en los botones de acciones
import { Pencil, EllipsisVertical, Menu, Eye } from "lucide-react";
// Implementamos ruta para abrir el modal
import BrandEditForm from "../components/BrandEditForm"
// Importamos useState para menejar estados
import { useState } from "react"


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
export default function BrandRowAction({ brand }) {
  //   Se implemento un estado
    const [modalAbierto, setModalAbierto] = useState(false)

  // Hook que permite redirigir a otra ruta desde código
  const navigate = useNavigate();

  // Manejar el estado del modal 
  const handleEdit = () => {
    setModalAbierto(true)
  };

 
  const handleView = () => {
    navigate(`/dashboard/materials/${brand.id}/view`);
  };


  // Acción para eliminar el usuario
  // Actualmente solo imprime en consola el id
  // En una aplicación real aquí se llamaría a la API
  const handleDelete = () => {
    console.log("Eliminar marca", brand.id);
  };


  return (
    // Contenedor de los botones de acciones
    <div className="flex gap-2 mx-auto">

      {/* Botón editar */}
      <IconButtonReal
        onClick={handleEdit} // Ejecuta la navegación a la página de edición
        variant="outline"
      >
        <Pencil size={20} /> {/* Icono de editar */}
      </IconButtonReal>


      
      {/* Modal, Siempre debe ir dentro de un return */}
      {modalAbierto && (
        <div
          // Toma toda laa pantalla con fondo de opacidad negro, sii da clic por fuera se cierra el modal
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setModalAbierto(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <BrandEditForm onClose={() => setModalAbierto(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
