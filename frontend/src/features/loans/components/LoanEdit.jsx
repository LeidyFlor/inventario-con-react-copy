import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, IconButton, Input, Textarea } from "@/shared";
import { ClipboardList, Pencil } from "lucide-react";
import { getUserName } from "../services/selectService.js";
import { loanSchema } from "../schemas/loanSchema";
import { loans } from "../data/loans";
import LoanMaterialsTable from "../components/LoanMaterialsTable";

export default function LoanEditPage() {
  // Hooks de navegación y parámetros de ruta
  const navigate = useNavigate();
  const { id } = useParams();

  // Busca el préstamo que se va a editar en los datos de ejemplo
  const loan = loans.find((loanItem) => loanItem.id === Number(id));

  // Opciones para el select de usuario solicitante
  const [userNameOptions, setUserNameOptions] = useState([]);

  // Errores de validación del formulario
  const [errors, setErrors] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estado local del formulario con valores iniciales del préstamo
  const [formData, setFormData] = useState(() => ({
    idLoan: loan?.idLoan ?? "",
    loanUserRequester: loan?.loanUserRequester ?? "",
    loanUserLender: loan?.loanUserLender ?? "",
    loanDateOut: loan?.loanDateOut ? loan.loanDateOut.slice(0, 10) : "",
    loanDateIn: loan?.loanDateIn ? loan.loanDateIn.slice(0, 10) : "",
    loanJustification: loan?.loanJustification ?? "",
    loanType: loan?.loanType ?? "",
    loanStatus: loan?.loanStatus ?? "",
    loanStudentsGroup: String(loan?.loanStudentsGroup ?? ""),
  }));

  // Materiales asociados al préstamo, con posibilidad de eliminar ítems
  const [materials, setMaterials] = useState(() => loan?.loanMaterials ?? []);

  // Carga las opciones de nombre de usuario al montar la página
  useEffect(() => {
    getUserName().then((data) =>
      setUserNameOptions(
        data.map((item) => ({ label: item.label, value: item.label }))
      )
    );
  }, []);

  // Maneja cambios de campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Remueve un material de la lista de materiales del préstamo
  const handleRemoveMaterial = (materialId) => {
    setMaterials((prev) => prev.filter((material) => material.id !== materialId));
  };

  // Actualiza la cantidad de un material en la tabla editable
  const handleQuantityChange = (materialId, newQuantity) => {
    setMaterials((prev) =>
      prev.map((material) =>
        material.id === materialId
          ? { ...material, cantidad: newQuantity }
          : material
      )
    );
  };

  // Valida y guarda el formulario de edición
  const handleSubmit = (e) => {
    e.preventDefault();

    const result = loanSchema.safeParse({
      loanUserRequester: formData.loanUserRequester,
      loanUserLender: formData.loanUserLender,
      loanJustification: formData.loanJustification,
      loanType: formData.loanType,
      loanDateOut: formData.loanDateOut,
      loanDateIn: formData.loanDateIn,
      loanStudentsGroup: formData.loanStudentsGroup,
    });

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const updatedLoan = {
      ...loan,
      ...formData,
      loanMaterials: materials,
      loanDateOut: formData.loanDateOut,
      loanDateIn: formData.loanDateIn,
    };

    console.log("Guardar préstamo:", updatedLoan);
    setIsEditModalOpen(false);
    navigate(-1);
  };

  return (
    <div className="p-2">
      <div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-max">
          <h1 className="flex items-center gap-3 text-gradient-title text-h3 pb-0.5">
            <ClipboardList className="text-brand" />
            Editar préstamo
          </h1>
          <div className="h-0.5 bg-gradiant-title-line"></div>
          </div>

          <div className="w-fit">
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={() => setIsEditModalOpen(true)}
            >
              Editar materiales
            </Button>
          </div>
        </div>

        {/* Formulario principal dividido en dos columnas: datos del préstamo y materiales */}
        <div className="block">
          <div className="w-full max-w-full mx-auto lg:mx-0 lg:min-w-0">

            {/* Tabla de materiales del préstamo. editable=true habilita cantidades y botón para eliminar filas */}
            <LoanMaterialsTable
              materials={materials}
              editable
              onQuantityChange={handleQuantityChange}
              onRemoveMaterial={handleRemoveMaterial}
            />
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl">
            <div className="flex flex-col items-start gap-2 mb-6 max-w-max">
              <div className="flex items-center gap-2 pb-0.5">
                <Pencil className="text-brand" />
                <h2 className="text-gradient-title text-h2">Editar préstamo</h2>
              </div>
              <div className="h-0.5 bg-gradiant-title-line w-full"></div>
            </div>

            <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ID préstamo"
                  value={formData.idLoan}
                  disabled
                  variant="isEdit"
                />

                <Input
                  label="Usuario solicitante"
                  name="loanUserRequester"
                  value={formData.loanUserRequester}
                  onChange={handleChange}
                  options={userNameOptions}
                  error={errors.loanUserRequester}
                  variant="isEdit"
                />

                <Input
                  label="Usuario prestador"
                  name="loanUserLender"
                  value={formData.loanUserLender}
                  onChange={handleChange}
                  error={errors.loanUserLender}
                  variant="isEdit"
                  disabled
                />

                <Input
                  label="Fecha de salida"
                  type="date"
                  name="loanDateOut"
                  value={formData.loanDateOut}
                  onChange={handleChange}
                  error={errors.loanDateOut}
                  variant="isEdit"
                  disabled
                />

                <Input
                  label="Fecha de entrega"
                  type="date"
                  name="loanDateIn"
                  value={formData.loanDateIn}
                  onChange={handleChange}
                  error={errors.loanDateIn}
                  variant="isEdit"
                />

                <Input
                  label="Estado préstamo"
                  value={formData.loanStatus}
                  disabled
                  variant="isEdit"
                />

                <Input
                  label="Tipo de préstamo"
                  value={formData.loanType}
                  disabled
                  variant="isEdit"
                />

                <Input
                  label="Grupo aprendices"
                  value={formData.loanStudentsGroup}
                  disabled
                  variant="isEdit"
                />
              </div>

              <Textarea
                label="Justificación"
                name="loanJustification"
                value={formData.loanJustification}
                onChange={handleChange}
                error={errors.loanJustification}
                variant="isEdit"
              />

              <div className="flex flex-row items-center justify-between gap-3 mt-4">
                <div className="w-fit">
                  <Button
                    variant="secondary"
                    size="md"
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="w-fit">
                  <IconButton size="md" type="submit">
                    Guardar
                  </IconButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
