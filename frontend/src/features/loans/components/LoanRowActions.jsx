// Iconos usados en los botones de acciones
import { Pencil, Eye, X, EllipsisVertical } from "lucide-react";

// Hook de React Router para navegar programáticamente entre rutas
import { useNavigate, Link } from "react-router-dom";
import { IconButtonReal, Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared";
import { usePermissions } from "@/features/permissions/context/PermissionsContext";
import { PERM } from "@/features/permissions/config/perms";


// Componente que renderiza las acciones de cada fila de préstamo
// Recibe como prop el objeto user
export default function LoanRowActions({ loan, onRemove }) {

  const navigate = useNavigate();
  const { hasPerm } = usePermissions();

  const canView   = hasPerm(PERM.LOAN_VIEW);
  const canChange = hasPerm(PERM.LOAN_CHANGE);

  // Si no puede ver ni modificar, no se muestra el dropdown de acciones
  const showActions = canView || canChange;

  const handleEdit = () => {
    navigate(`/dashboard/loans/${loan.id}/edit`);
  };

  const handleView = () => {
    navigate(`/dashboard/loans/${loan.id}/view`);
  };

  return (
      <div className="flex gap-2">
        {/* <IconButtonReal
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
        </IconButtonReal> */}
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
          {/* Dropdown de acciones — se oculta completo si no tiene ningún permiso */}
          {showActions && (
          <div className="">
              <Dropdown>
                  <DropdownTrigger>
                      <IconButtonReal arialLabel="Devolucion/aprobar prestamos" variant="outline" hitSize={40}
                          iconSize={18}>

                          <EllipsisVertical size={18}/>

                      </IconButtonReal>
                  </DropdownTrigger>

                  <DropdownContent className="right-0 w-48">
                      {canView && (
                      <DropdownItem>
                          <Link to={`/dashboard/loans/${loan.id}/view`} className="block w-full">
                              Ver préstamo
                          </Link>
                      </DropdownItem>
                      )}
                      {canChange && (
                      <DropdownItem>
                          <Link to ={`/dashboard/loans/${loan.id}/edit`} className="block w-full">
                              Editar préstamo
                          </Link>
                      </DropdownItem>
                      )}
                      {canChange && (
                      <DropdownItem>
                          <Link to={`/dashboard/loans/${loan.id}/return`} className="block w-full">
                              Devolver préstamo
                          </Link>
                      </DropdownItem>
                      )}
                      {canChange && (
                      <DropdownItem>
                          <Link to={`/dashboard/loans/${loan.id}/accept-return`} className="block w-full">
                              Aceptar retorno de préstamo
                          </Link>
                      </DropdownItem>
                      )}
                  </DropdownContent>
              </Dropdown>
          </div>
          )}

      </div>
  );
}
