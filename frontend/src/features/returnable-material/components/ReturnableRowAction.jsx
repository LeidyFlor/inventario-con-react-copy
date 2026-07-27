// Iconos usados en los botones de acciones
import { Pencil, Menu, Eye } from "lucide-react";


// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate, Link } from "react-router-dom";
import {
    Dropdown,
    IconButtonReal,
    DropdownContent,
    DropdownTrigger,
    DropdownItem
} from "@/shared"
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM } from "@/features/permissions/config/perms";


// Componente que renderiza las acciones de cada fila de usuario
// Recibe como prop el objeto user
export default function ReturnableRowActions({ returnable }) {

    const { hasPerm } = usePermissions();

    // Hook que permite redirigir a otra ruta desde código
    const navigate = useNavigate();


    // Acción para editar el usuario
    // Redirige a la página de edición usando el id del material
    const handleEdit = () => {
        navigate(`/dashboard/returnable-materials/${returnable.id}/edit`);
    }; 
    const handleView = () => {
        navigate(`/dashboard/returnable-materials/${returnable.id}/view`);
    };


    // Acción para eliminar el material
    // Actualmente solo imprime en consola el id
    // En una aplicación real aquí se llamaría a la API
    // const handleDelete = () => {
    //     console.log("Eliminar material devolutivo", returnable.id);
    // };

    return (
        // Contenedor de los botones de acciones
        <div className="flex gap-2">
            <div className="flex gap-2">

                {/* Botón editar — requiere permiso de actualizar material devolutivo */}
                {hasPerm(PERM.RETURNABLE_CHANGE) && (
                <IconButtonReal
                    onClick={handleEdit} // Ejecuta la navegación a la página de edición
                    variant="outline"
                >
                    <Pencil size={20} /> {/* Icono de editar */}
                </IconButtonReal>
                )}

                {/* Botón Visualizar — requiere permiso de ver material devolutivo */}
                {hasPerm(PERM.RETURNABLE_VIEW) && (
                <IconButtonReal
                    onClick={handleView} // Ejecuta la navegación a la página de visualizar
                    variant="outline"
                >
                    <Eye size={20} /> {/* Icono de visualizar */}
                </IconButtonReal>
                )}

            </div>

        </div>
    );
}
