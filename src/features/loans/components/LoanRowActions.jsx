// Iconos usados en los botones de acciones
import { Pencil, EllipsisVertical, Menu } from "lucide-react";


// Hook de React Router para navegar programáticamente entre rutas
import {  Link } from "react-router-dom";
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

  // Acción para editar el préstamo
  // Redirige a la página de edición usando el id del préstamo



  // Acción para eliminar el préstamo
  // Actualmente solo imprime en consola el id
  // En una aplicación real aquí se llamaría a la API
  const handleDelete = () => {
    console.log("Eliminar préstamo", loan.id);
  };


  return (
    // Contenedor de los botones de acciones
    <div className="flex gap-2">

      {/* Botón opciones */}
      <button
        //onClick={handleDelete} // Ejecuta la acción de eliminación
        className="p-1 rounded hover:bg-focus-border"
      >
        <div className="p-1">
            <Dropdown>
                <DropdownTrigger>
                      <EllipsisVertical size={16} />
                </DropdownTrigger>

                <DropdownContent className="w-48">
                  <DropdownItem>
                      <Link to="" className="block">
                        Visualizar préstamo
                      </Link>
                  </DropdownItem>

                  <DropdownItem>
                      <Link to="" className="block">
                        Retornar material
                      </Link>
                  </DropdownItem>

                  <DropdownItem>
                      <Link to="" className="block">
                        Aprobar retorno
                      </Link>
                  </DropdownItem>

                </DropdownContent>
            </Dropdown>
         </div>

      </button>


    </div>
  );
}
