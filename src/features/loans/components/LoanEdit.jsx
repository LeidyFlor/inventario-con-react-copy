import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, IconButton, Input, Select, Textarea } from "@/shared";
import { ClipboardList } from "lucide-react";
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
    navigate(-1);
  };

  return (
    <div className="flex flex-col place-items-center justify-items-center relative px-4 py-6">
      <div className="bg-gradient-container-green border-4 border-border-green-container p-4 md:p-6 rounded-4xl w-full max-w-5xl lg:max-w-6xl mx-auto overflow-hidden">
        <div className="mb-6 max-w-max">
          <h1 className="flex items-center gap-3 text-gradient-title text-h3 pb-0.5">
            <ClipboardList className="text-brand" />
            Editar préstamo
          </h1>
          <div className="h-0.5 bg-gradiant-title-line"></div>
        </div>

        {/* Formulario principal dividido en dos columnas: datos del préstamo y materiales */}
        <form
          className="flex flex-col-reverse lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start gap-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="rounded-4xl border border-border bg-background p-6 shadow-sm w-full max-w-full mx-auto lg:mx-0 lg:self-start">
            <div className="grid gap-4 w-full">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <Textarea
                label="Justificación"
                name="loanJustification"
                value={formData.loanJustification}
                onChange={handleChange}
                error={errors.loanJustification}
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

            <div className="mt-6 flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-3 sm:gap-6 lg:gap-16">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>

              <IconButton size="md" type="submit">
                Guardar
              </IconButton>
            </div>
          </div>

          <div className="w-full max-w-full mx-auto lg:mx-0 lg:min-w-0 ">

            {/* Tabla de materiales del préstamo. editable=true habilita cantidades y botón para eliminar filas */}
            <LoanMaterialsTable
              materials={materials}
              editable
              className
              onQuantityChange={handleQuantityChange}
              onRemoveMaterial={handleRemoveMaterial}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
