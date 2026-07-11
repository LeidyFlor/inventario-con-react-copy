import { useEffect, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { Button, IconButton, Input, Select, Textarea } from "@/shared";
import { ClipboardList, Pencil } from "lucide-react";
import { loanSchema } from "../schemas/loanSchema";
import LoanMaterialsTable from "../components/LoanMaterialsTable";
import { getLoan, updateLoan } from "../services/loanService";
import { getUserName } from "../services/selectService";
import { Alert } from "@/shared/components/utils/alert";
import { Ping } from "ldrs/react";
import "ldrs/react/Ping.css";

export default function LoanEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loan, setLoan]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [errors, setErrors]       = useState({});
  const [isDirty, setIsDirty]     = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData]   = useState({});
  const [materials, setMaterials] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      Alert.warning("¿Salir sin guardar?", "Los cambios no guardados se perderán.")
        .then((result) => {
          if (result.isConfirmed) {
            setIsDirty(false);
            blocker.proceed();
          } else {
            blocker.reset();
          }
        });
    }
  }, [blocker]);

  useEffect(() => {
    Promise.all([getLoan(id), getUserName()])
      .then(([data, users]) => {
        setLoan(data);
        setMaterials(data.loanMaterials ?? []);
        setUserOptions(users);
        setFormData({
          idLoan:            data.idLoan,
          loanUserRequester: data.loanUserRequester,
          loanUserLender:    data.loanUserLender,
          loanDateOut:       data.loanDateOut ? data.loanDateOut.slice(0, 10) : "",
          loanDateIn:        data.loanDateIn  ? data.loanDateIn.slice(0, 10)  : "",
          loanJustification: data.loanJustification,
          loanType:          data.loanType,
          loanStatus:        data.loanStatus,
          loanStudentsGroup: String(data.loanStudentsGroup ?? ""),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex flex-col place-items-center gap-2 mt-20">
      <Ping size="45" speed="1.5" color="#56B526" />
      <p className="text-text-muted text-center">Cargando préstamo...</p>
    </div>
  );
  if (!loan) return <p>Préstamo no encontrado</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleRemoveMaterial = (materialId) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
  };

  const handleQuantityChange = (materialId, newQuantity) => {
    setMaterials((prev) =>
      prev.map((m) => m.id === materialId ? { ...m, cantidad: newQuantity } : m)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = loanSchema.safeParse({
      loanUserRequester: formData.loanUserRequester,
      loanUserLender:    formData.loanUserLender,
      loanJustification: formData.loanJustification,
      loanType:          formData.loanType,
      loanDateOut:       formData.loanDateOut,
      loanDateIn:        formData.loanDateIn,
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

    try {
      Alert.loading("Guardando cambios...");
      await updateLoan(id, formData);
      setIsDirty(false);
      setIsEditModalOpen(false);
      Alert.close();
      await Alert.success("Cambios guardados", "El préstamo fue actualizado correctamente.");
      navigate(-1);
    } catch (err) {
      console.error("Error al guardar préstamo:", err);
      Alert.close();
      Alert.error("Error al guardar", "No se pudieron guardar los cambios. Intenta de nuevo.");
    }
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
              variant="warning"
              size="sm"
              type="button"
              onClick={() => setIsEditModalOpen(true)}
            >
              Editar datos préstamo
            </Button>
          </div>
        </div>

        <div className="block">
          <div className="w-full max-w-full mx-auto lg:mx-0 lg:min-w-0">
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

                <Select
                  label="Usuario solicitante"
                  name="loanUserRequester"
                  options={userOptions}
                  value={formData.loanUserRequester}
                  onChange={handleChange}
                  error={errors.loanUserRequester}
                  variant="isEdit"
                />

                <Input
                  label="Usuario prestador"
                  value={formData.loanUserLender}
                  disabled
                  variant="isEdit"
                />

                <Input
                  label="Fecha de salida"
                  type="date"
                  value={formData.loanDateOut}
                  disabled
                  variant="isEdit"
                />

                <Input
                  label="Fecha estimada de entrega"
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
