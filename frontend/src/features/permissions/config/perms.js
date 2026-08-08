/**
 * Constantes de permisos del sistema.
 *
 * Los strings deben coincidir exactamente con los que devuelve el backend
 * en GET /api/users/me/permissions/, con el formato "app_label.codename".
 *
 * Usar estas constantes en vez de escribir los strings a mano evita errores
 * de tipeo que harían que un permiso nunca coincida y el elemento quede oculto.
 */

export const PERM = {
    // ── Usuarios (app_label: users) ────────────────────────────────
    USER_ADD:    "users.add_users",
    USER_VIEW:   "users.view_users",
    USER_CHANGE: "users.change_users",
    USER_DELETE: "users.delete_users",
    USER_LIST:   "users.listar_usuarios",
    USER_REPORT: "users.generar_reporte_usuarios",

    // ── Grupos (app_label: auth — modelo Group de Django) ──────────
    GROUP_ADD:    "auth.add_group",
    GROUP_VIEW:   "auth.view_group",
    GROUP_CHANGE: "auth.change_group",
    GROUP_DELETE: "auth.delete_group",

    // ── Marcas (app_label: materials) ──────────────────────────────
    BRAND_ADD:    "materials.add_brand",
    BRAND_VIEW:   "materials.view_brand",
    BRAND_CHANGE: "materials.change_brand",
    BRAND_DELETE: "materials.delete_brand",
    BRAND_LIST:   "materials.listar_brand",
    BRAND_REPORT: "materials.generar_reporte_brand",

    // ── Nombres de inventario (app_label: inventory_name) ──────────
    // No tiene reporte propio: aparece como columna y filtro dentro del
    // reporte de materiales, que ya tiene su permiso.
    INVENTORY_NAME_ADD:    "inventory_name.add_inventoryname",
    INVENTORY_NAME_VIEW:   "inventory_name.view_inventoryname",
    INVENTORY_NAME_CHANGE: "inventory_name.change_inventoryname",
    INVENTORY_NAME_DELETE: "inventory_name.delete_inventoryname",
    INVENTORY_NAME_LIST:   "inventory_name.listar_inventoryname",

    // ── Categorías (app_label: category) ───────────────────────────
    // Es la categoría administrable desde Configuración, NO la lista fija
    // de herramienta/maquinaria/muebles, que ahora se llama tipo de material.
    CATEGORY_ADD:    "category.add_category",
    CATEGORY_VIEW:   "category.view_category",
    CATEGORY_CHANGE: "category.change_category",
    CATEGORY_DELETE: "category.delete_category",
    CATEGORY_LIST:   "category.listar_category",

    // ── Cotizaciones (app_label: quotation) ────────────────────────
    // El archivo PDF no se edita, pero CHANGE sí se usa: gobierna el
    // desenlazar de todos los materiales, que modifica los materiales sin
    // tocar la cotización. DELETE aquí borra de verdad, no desactiva.
    QUOTATION_ADD:    "quotation.add_quotation",
    QUOTATION_VIEW:   "quotation.view_quotation",
    QUOTATION_CHANGE: "quotation.change_quotation",
    QUOTATION_DELETE: "quotation.delete_quotation",
    QUOTATION_LIST:   "quotation.listar_quotation",

    // ── Material de consumo (app_label: materials) ─────────────────
    CONSUMABLE_ADD:    "materials.add_consumablematerial",
    CONSUMABLE_VIEW:   "materials.view_consumablematerial",
    CONSUMABLE_CHANGE: "materials.change_consumablematerial",
    CONSUMABLE_DELETE: "materials.delete_consumablematerial",
    CONSUMABLE_LIST:   "materials.listar_consumablematerial",
    CONSUMABLE_REPORT: "materials.generar_reporte_consumablematerial",

    // ── Material devolutivo (app_label: materials) ─────────────────
    RETURNABLE_ADD:    "materials.add_returnablematerial",
    RETURNABLE_VIEW:   "materials.view_returnablematerial",
    RETURNABLE_CHANGE: "materials.change_returnablematerial",
    RETURNABLE_DELETE: "materials.delete_returnablematerial",
    RETURNABLE_LIST:   "materials.listar_returnablematerial",
    RETURNABLE_REPORT: "materials.generar_reporte_returnablematerial",

    // ── Préstamos (app_label: loans) ───────────────────────────────
    LOAN_ADD:    "loans.add_loan",
    LOAN_VIEW:   "loans.view_loan",
    LOAN_CHANGE: "loans.change_loan",
    LOAN_DELETE: "loans.delete_loan",
    LOAN_LIST:   "loans.listar_loan",
    LOAN_REPORT: "loans.generar_reporte_loan",

    // ── Tareas (app_label: tasks) ──────────────────────────────────
    TASK_ADD:    "tasks.add_task",
    TASK_VIEW:   "tasks.view_task",
    TASK_CHANGE: "tasks.change_task",
    TASK_DELETE: "tasks.delete_task",
}

/**
 * Permisos que necesita CADA PANTALLA para funcionar completa.
 *
 * No es lo mismo que el permiso de la acción. Una pantalla suele consultar
 * varios recursos al montarse, y si le falta el permiso de alguno el backend
 * responde 403, el interceptor global muestra "Acceso denegado" y devuelve al
 * inicio. Desde fuera parece un error del sistema.
 *
 * Por eso se listan aquí, en un solo lugar, y se usan en DOS sitios:
 *
 *   - el guard de la ruta (RequirePerm allOf), para quien escribe la URL
 *   - el botón o el ítem de menú que lleva a la pantalla, para que ni siquiera
 *     aparezca si no se va a poder usar
 *
 * Tenerlos juntos evita que se desincronicen, que es justo lo que hacía que un
 * botón visible terminara en "Acceso denegado".
 *
 * Al agregar una petición nueva a una pantalla, hay que sumar su permiso aquí.
 */
export const SCREEN_PERMS = {
    // Carga usuarios (select de solicitante), prestadores y los dos catálogos
    // de material para poder elegir qué se presta
    LOAN_CREATE: [
        PERM.LOAN_ADD,
        PERM.LOAN_VIEW,      // /api/loans/lenders/
        PERM.USER_LIST,      // select de solicitante
        PERM.RETURNABLE_LIST,
        PERM.CONSUMABLE_LIST,
    ],
    // Carga el préstamo y el select de usuarios
    LOAN_EDIT: [PERM.LOAN_CHANGE, PERM.LOAN_VIEW, PERM.USER_LIST],
    // Las dos pantallas cargan el préstamo con getLoan()
    LOAN_RETURN: [PERM.LOAN_CHANGE, PERM.LOAN_VIEW],
    LOAN_ACCEPT: [PERM.LOAN_ADD, PERM.LOAN_VIEW],

    // Los formularios de material cargan marca, inventario, categoría y
    // cotizaciones para sus selects
    CONSUMABLE_CREATE: [
        PERM.CONSUMABLE_ADD,
        PERM.BRAND_LIST,
        PERM.INVENTORY_NAME_LIST,
        PERM.CATEGORY_LIST,
        PERM.QUOTATION_LIST,
    ],
    CONSUMABLE_EDIT: [
        PERM.CONSUMABLE_CHANGE,
        PERM.CONSUMABLE_VIEW,
        PERM.BRAND_LIST,
        PERM.INVENTORY_NAME_LIST,
        PERM.CATEGORY_LIST,
        PERM.QUOTATION_LIST,
    ],
    RETURNABLE_CREATE: [
        PERM.RETURNABLE_ADD,
        PERM.BRAND_LIST,
        PERM.INVENTORY_NAME_LIST,
        PERM.CATEGORY_LIST,
        PERM.QUOTATION_LIST,
    ],
    // Busca el material dentro del listado completo, por eso pide LIST
    RETURNABLE_EDIT: [
        PERM.RETURNABLE_CHANGE,
        PERM.RETURNABLE_LIST,
        PERM.BRAND_LIST,
        PERM.INVENTORY_NAME_LIST,
        PERM.CATEGORY_LIST,
        PERM.QUOTATION_LIST,
    ],
    // Visualizar devolutivo también resuelve el material desde el listado
    RETURNABLE_VIEW: [PERM.RETURNABLE_VIEW, PERM.RETURNABLE_LIST],

    // Crear y editar usuario cargan el select de grupos
    USER_CREATE: [PERM.USER_ADD, PERM.GROUP_VIEW],
    USER_EDIT: [PERM.USER_CHANGE, PERM.GROUP_VIEW],

    // El formulario de tareas carga los selects de usuarios y de grupos
    TASK_MANAGE: [PERM.TASK_ADD, PERM.USER_LIST, PERM.GROUP_VIEW],
}

/**
 * Agrupaciones por módulo.
 * Se usan con hasAnyPerm() para decidir si se muestra el botón completo
 * de un módulo en el Navbar: si el usuario no tiene NINGUNO de estos
 * permisos, el botón entero se oculta.
 */
export const MODULE_PERMS = {
    LOANS: [
        PERM.LOAN_ADD,
        PERM.LOAN_LIST,
        PERM.LOAN_VIEW,
        PERM.LOAN_REPORT,
    ],
    RETURNABLE: [
        PERM.RETURNABLE_ADD,
        PERM.RETURNABLE_LIST,
        PERM.RETURNABLE_VIEW,
        PERM.RETURNABLE_REPORT,
    ],
    CONSUMABLE: [
        PERM.CONSUMABLE_ADD,
        PERM.CONSUMABLE_LIST,
        PERM.CONSUMABLE_VIEW,
        PERM.CONSUMABLE_REPORT,
    ],
    // Configuración agrupa marcas, inventarios, categorías, grupos y tareas.
    // Los ítems de "Permisos" e "Historial" se controlan aparte:
    // permisos → solo superadmin, historial → solo staff.
    CONFIG: [
        PERM.BRAND_LIST,
        PERM.BRAND_ADD,
        PERM.INVENTORY_NAME_LIST,
        PERM.INVENTORY_NAME_ADD,
        PERM.CATEGORY_LIST,
        PERM.CATEGORY_ADD,
        PERM.QUOTATION_LIST,
        PERM.QUOTATION_ADD,
        PERM.GROUP_VIEW,
        PERM.GROUP_ADD,
        PERM.TASK_ADD,
        PERM.TASK_VIEW,
    ],
    USERS: [
        PERM.USER_ADD,
        PERM.USER_LIST,
        PERM.USER_VIEW,
        PERM.USER_REPORT,
    ],
}
