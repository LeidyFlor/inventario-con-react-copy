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
    // Configuración agrupa marcas, grupos y tareas.
    // Los ítems de "Permisos" e "Historial" se controlan aparte:
    // permisos → solo superadmin, historial → solo staff.
    CONFIG: [
        PERM.BRAND_LIST,
        PERM.BRAND_ADD,
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
