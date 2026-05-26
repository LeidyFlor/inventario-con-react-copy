// src/config/permissions.config.js
//La key de los permisos debe conincidir con lo que se recibe del backend

export const PERMISSIONS = [
  {
    category: "Gestión Usuarios",
    key: "Usuarios",
    permissions: [
      { key: "Usuarios_crear", label: "Crear usuarios" },
      { key: "Usuarios_visualizar", label: "Visualizar usuarios" },
      { key: "Usuarios_actualizar", label: "Actualizar usuarios" },
      { key: "Usuarios_listar", label: "Listar usuarios" },
      {
        key: "Usuarios_activar_desactivar",
        label: "Activar/Desactivar usuarios",
      },
      { key: "Usuarios_reporte", label: "Generar reporte usuarios" },
    ],
  },
  {
    category: "Gestión Marcas",
    key: "Marcas",
    permissions: [
      { key: "Marcas_crear", label: "Crear marca" },
      { key: "Marcas_visualizar", label: "Visualizar marca" },
      { key: "Marcas_actualizar", label: "Actualizar marca" },
      { key: "Marcas_activar_desactivar", label: "Activar/Desactivar marca" },
      { key: "Marcas_reporte", label: "Generar reporte marcas" },
    ],
  },
  {
    category: "Gestión Material de Consumo",
    key: "Materiales",
    permissions: [
      { key: "Materiales_crear", label: "Crear material consumo" },
      { key: "Materiales_visualizar", label: "Visualizar material consumo" },
      { key: "Materiales_actualizar", label: "Actualizar material consumo" },
      { key: "Materiales_listar", label: "Listar material consumo" },
      {
        key: "Materiales_activar_desactivar",
        label: "Activar/Desactivar material consumo",
      },
      { key: "Materiales_reporte", label: "Generar reporte material consumo" },
    ],
  },
  {
    category: "Gestión Material Devolutivo",
    key: "Material_Devolutivo",
    permissions: [
      { key: "Material_Devolutivo_crear", label: "Crear material devolutivo" },
      {
        key: "Material_Devolutivo_visualizar",
        label: "Visualizar material devolutivo",
      },
      {
        key: "Material_Devolutivo_actualizar",
        label: "Actualizar material devolutivo",
      },
      {
        key: "Material_Devolutivo_listar",
        label: "Listar material devolutivo",
      },
      {
        key: "Material_Devolutivo_activar_desactivar",
        label: "Activar/Desactivar material devolutivo",
      },
      {
        key: "Material_Devolutivo_reporte",
        label: "Generar reporte material devolutivo",
      },
    ],
  },
  {
    category: "Gestión Préstamos",
    key: "Prestamos",
    permissions: [
      { key: "Prestamos_crear", label: "Crear préstamo" },
      { key: "Prestamos_visualizar", label: "Visualizar préstamo" },
      { key: "Prestamos_actualizar", label: "Actualizar préstamo" },
      { key: "Prestamos_listar", label: "Listar préstamos" },
      {
        key: "Prestamos_activar_desactivar",
        label: "Activar/Desactivar préstamo",
      },
      { key: "Prestamos_reporte", label: "Generar reporte préstamos" },
    ],
  },
  {
    category: "Retorno Préstamos",
    key: "RetornarPrestamos",
    permissions: [
      { key: "RetornarPrestamos_retornar", label: "Retornar préstamo" },
      { key: "RetornarPrestamos_aprobar", label: "Aprobar retorno préstamo" },
    ],
  },
];
