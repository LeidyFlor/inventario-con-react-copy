// src/config/permissions.config.js
// Las keys deben coincidir con los codenames de Django (permission.codename)

export const PERMISSIONS = [
  {
    category: "Gestión Usuarios",
    key: "users",
    permissions: [
      { key: "add_users",                label: "Crear usuarios" },
      { key: "view_users",               label: "Visualizar usuarios" },
      { key: "change_users",             label: "Actualizar usuarios" },
      { key: "listar_usuarios",          label: "Listar usuarios" },
      { key: "delete_users",             label: "Activar/Desactivar usuarios" },
      { key: "generar_reporte_usuarios", label: "Generar reporte usuarios" },
    ],
  },
  {
    category: "Gestión Marcas",
    key: "brand",
    permissions: [
      { key: "add_brand",               label: "Crear marca" },
      { key: "view_brand",              label: "Visualizar marca" },
      { key: "change_brand",            label: "Actualizar marca" },
      { key: "delete_brand",            label: "Activar/Desactivar marca" },
      { key: "listar_brand",            label: "Listar marcas" },
      { key: "generar_reporte_brand",   label: "Generar reporte marcas" },
    ],
  },
  {
    category: "Gestión Material de Consumo",
    key: "consumablematerial",
    permissions: [
      { key: "add_consumablematerial",                label: "Crear material consumo" },
      { key: "view_consumablematerial",               label: "Visualizar material consumo" },
      { key: "change_consumablematerial",             label: "Actualizar material consumo" },
      { key: "listar_consumablematerial",             label: "Listar material consumo" },
      { key: "delete_consumablematerial",             label: "Activar/Desactivar material consumo" },
      { key: "generar_reporte_consumablematerial",    label: "Generar reporte material consumo" },
    ],
  },
  {
    category: "Gestión Material Devolutivo",
    key: "returnablematerial",
    permissions: [
      { key: "add_returnablematerial",               label: "Crear material devolutivo" },
      { key: "view_returnablematerial",              label: "Visualizar material devolutivo" },
      { key: "change_returnablematerial",            label: "Actualizar material devolutivo" },
      { key: "listar_returnablematerial",            label: "Listar material devolutivo" },
      { key: "delete_returnablematerial",            label: "Activar/Desactivar material devolutivo" },
      { key: "generar_reporte_returnablematerial",   label: "Generar reporte material devolutivo" },
    ],
  },
  // Prestamos se agrega cuando exista el modelo en el backend
];
