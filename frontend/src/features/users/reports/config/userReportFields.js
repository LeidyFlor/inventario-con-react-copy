// Campos que se desean tener en el reporte
//los campos seben ser los del backend
export const userReportFields = [
  {
    key: "user_document",
    label: "Número de documento",
    default: true,
  },
  {
    key: "user_document_type",
    label: "Tipo de documento",
    default: true,
  },
  {
    key: "first_name",
    label: "Nombre(s)",
    default: true,
  },
  {
    key: "last_name",
    label: "Apellido(s)",
    default: true,
  },
  {
    key: "groups",
    label: "Tipo de usuario",
    default: true,
  },
  {
    key: "user_date_start",
    label: "Fecha de inicio",
    default: true,
  },
  {
    key: "user_date_end",
    label: "Fecha fin",
    default: true,
  },
  {
    key: "user_tel",
    label: "Número telefónico",
    default: false,
  },
  {
    key: "user_tel2",
    label: "Segundo número telefónico",
    default: false,
  },
  {
    key: "email",
    label: "Correo personal",
    default: true,
  },
  {
    key: "user_email2",
    label: "Correo institucional",
    default: false,
  },
  {
    key: "user_addres",
    label: "Dirección",
    default: false,
  },
  {
    key: "is_active",
    label: "Estado",
    default: false,
  },
];
