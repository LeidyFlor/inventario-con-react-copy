// Iconos usados en los botones de acciones
import { Pencil, Eye, X } from "lucide-react";


// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate } from "react-router-dom";
import { IconButtonReal } from "@/shared";


// Componente que renderiza las acciones de cada fila de préstamo
// Recibe como prop el objeto user
export default function LoanRowActions({ loan, onRemove }) {

  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/dashboard/loans/${loan.id}/edit`);
  };

  const handleView = () => {
    navigate(`/dashboard/loans/${loan.id}/view`);
  };

  return (
      <div className="flex gap-2">
        <IconButtonReal
            onClick={handleEdit}
            variant="outline"
            ariaLabel="Editar préstamo"
            hitSize={40}
            iconSize={18}
        >
            <Pencil size={18} />
        </IconButtonReal>
        <IconButtonReal
            onClick={handleView}
            variant="outline"
            ariaLabel="Ver préstamo"
            hitSize={40}
            iconSize={18}
        >
            <Eye size={18} />
        </IconButtonReal>
        {onRemove && (
            <IconButtonReal
                onClick={() => onRemove?.()}
                variant="outline"
                ariaLabel="Remover préstamo"
                hitSize={40}
                iconSize={18}
            >
                <X size={18} />
            </IconButtonReal>
        )}
      </div>
  );
}
