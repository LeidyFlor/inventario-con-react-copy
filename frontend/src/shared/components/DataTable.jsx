// Hooks y utilidades principales de TanStack Table
import {
    useReactTable,          // Hook que crea la instancia de la tabla
    getCoreRowModel,        // Modelo base de filas (sin filtros ni paginación)
    flexRender,             // Permite renderizar contenido dinámico de columnas
    getPaginationRowModel,  // Modelo de filas con paginación
    getFilteredRowModel     // Modelo de filas filtradas
} from "@tanstack/react-table"


// Hook de React para manejar estado
import { useState } from "react"


// Botón reutilizable del sistema de componentes
import { Button } from "@/shared/"


// Componente reutilizable de tabla
// Recibe:
// - data: datos que se mostrarán
// - columns: configuración de columnas
export default function DataTable({ data, columns, compact = false }) {


    // ================== ESTADO DE PAGINACIÓN ==================
    // pageIndex → página actual
    // pageSize → cantidad de filas por página
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5
    })


    // ================== ESTADO DEL FILTRO GLOBAL ==================
    // Se usa para el buscador de la tabla
    const [globalFilter, setGlobalFilter] = useState("")


    // ================== CONFIGURACIÓN DE LA TABLA ==================
    const table = useReactTable({


        // Datos que se mostrarán
        data,


        // Definición de columnas
        columns,


        // Estado controlado de la tabla
        state: {
            globalFilter,
            pagination
        },


        // Función que se ejecuta cuando cambia la paginación
        onPaginationChange: setPagination,


        // Función que se ejecuta cuando cambia el filtro global
        onGlobalFilterChange: setGlobalFilter,

        // Row ids estables usando la propiedad id si existe
        getRowId: (row) => (row.id != null ? String(row.id) : undefined),

        // Modelo base de filas
        getCoreRowModel: getCoreRowModel(),


        // Modelo con filtrado aplicado
        getFilteredRowModel: getFilteredRowModel(),


        // Modelo con paginación aplicada
        getPaginationRowModel: getPaginationRowModel(),
    })


    return (
        <div className={compact ? "space-y-2" : "space-y-4"}>


            {/* ================== TOOLBAR ================== */}
            {/* Barra superior con buscador y selector de filas */}


            <div className="flex items-center justify-between gap-4">


                {/* ================== BUSCADOR ================== */}
                {/* Filtra todas las columnas de la tabla */}
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className={`border rounded-xl px-3 w-64 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring ${compact ? "py-1.5" : "py-2"}`}
                />


                {/* ================== SELECTOR DE FILAS ================== */}
                {/* Permite cambiar cuántas filas se muestran por página */}
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className={`border rounded-xl px-2 w-64 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring ${compact ? "py-1.5" : "py-2"}`}
                >
                    {[5, 7, 10, 20, 50].map(size => (
                        <option key={size} value={size}>
                            {size} filas
                        </option>
                    ))}
                </select>


            </div>


            {/* ================== TABLA ================== */}
            {/* overflow-x-auto SIN el md:overflow-x-hidden que tenía antes.
                Ese hidden recortaba la tabla en tablet y escritorio: si las
                columnas no cabían, las últimas (entre ellas la de acciones)
                quedaban cortadas y sin forma de llegar a ellas.

                min-w-max en la tabla es lo que hace que el scroll exista: sin
                él, w-full la obliga a caber en el contenedor y el navegador
                aprieta las columnas en vez de desbordar. */}
            <div className="overflow-x-auto border border-background-dropdown rounded-2xl">
                <table className="w-full min-w-max">


                    {/* ================== CABECERA ================== */}
                    <thead className="bg-gradient-navbar">


                        {/* TanStack agrupa cabeceras automáticamente */}
                        {table.getHeaderGroups().map(headerGroup => (


                            <tr key={headerGroup.id}>


                                {headerGroup.headers.map(header => (


                                    <th
                                        key={header.id}
                                        className="p-3 text-left border-b text-text-inverse"
                                    >


                                        {/* 
                      flexRender permite renderizar:
                      - texto
                      - JSX
                      - funciones
                      definidos en columnDef.header
                    */}
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}


                                    </th>


                                ))}
                            </tr>


                        ))}
                    </thead>


                    {/* =============== CUERPO DE LA TABLA ================ */}
                    <tbody>


                        {/* Filas generadas por TanStack */}
                        {table.getRowModel().rows.map(row => (


                            <tr key={row.id} className="bg-background hover:bg-surface">


                                {/* Celdas visibles de cada fila */}
                                {row.getVisibleCells().map(cell => (


                                    <td key={cell.id} className="py-2em px-3 border-b border-background-dropdown">


                                        {/* Render dinámico del contenido de la celda */}
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}


                                    </td>


                                ))}


                            </tr>


                        ))}


                    </tbody>


                </table>
            </div>


            {/* ================== FOOTER ================== */}
            <div className="flex flex-col md:flex-row items-center justify-between">


                {/* ================== INFORMACIÓN ================== */}
                {/* Cantidad de registros visibles */}
                <span className="text-body text-text-primary mb-2 md:mb-0">
                    Mostrando {table.getRowModel().rows.length} de{" "}
                    {table.getFilteredRowModel().rows.length} registros
                </span>


                {/* ================== CONTROLES DE PAGINACIÓN ================== */}
                <div className="flex items-center gap-2">


                    {/* Ir a la primera página */}
                    <Button
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        showIcon={false}
                    >
                        Inicio
                    </Button>


                    {/* Página anterior */}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>


                    {/* Información de página actual */}
                    <span className="text-sm px-2 hidden md:block">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount()}
                    </span>


                    {/* Página siguiente */}
                    <Button
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        showIcon={false}
                    >
                        Siguiente
                    </Button>


                    {/* Ir a la última página */}
                    <Button
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        showIcon = {false}
                    >
                        Final
                    </Button>


                </div>

            </div>

            {/* ================== IR A PÁGINA ================== */}
            {/* Permite navegar directamente a una página específica */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm">


                <span>Ir a página:</span>


                <input
                    type="number"


                    // Página actual (se muestra +1 porque el índice empieza en 0)
                    defaultValue={table.getState().pagination.pageIndex + 1}

                    onChange={(e) => {

                        // Convierte el número ingresado en índice de página
                        const page = e.target.value ? Number(e.target.value) - 1 : 0


                        // Cambia la página
                        table.setPageIndex(page)
                    }}


                    className="border rounded-xl px-2 py-1 w-16 hover:border-focus-border focus:outline-none focus:ring-1 focus:ring-focus-ring"
                />
                
                {/* Información de página actual */}
                <span className="text-sm px-2  md:hidden">
                    Página {table.getState().pagination.pageIndex + 1} de{" "}
                    {table.getPageCount()}
                </span>  


            </div>

        </div>
    )
}
