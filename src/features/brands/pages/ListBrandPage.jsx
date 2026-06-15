import { useState } from "react"
import DataTable from "@/shared/components/DataTable"
import { brandsColumns } from "../table/brandsColumns"
import { brands } from "../data/brands"
import { Button } from "@/shared/"
import { ClipboardList } from "lucide-react"
import BrandRegisterForm from "../components/BrandRegisterForm" // ajusta la ruta según tu proyecto


export default function ListBrandPage() {
//   Se implemento un estado
  const [modalAbierto, setModalAbierto] = useState(false)

  return (      
    // Centra y pone un tamaño de ancho dependiendo el numero
    <div className="p-6 max-w-3xl mx-auto">
        <div className="flex justify-between"> 
              <div className="mb-6 max-w-max">
                  <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                      <ClipboardList className="text-brand" />
                      Listar marcas
                  </h1>
                  <div className="h-0.5 bg-gradiant-title-line"></div>
              </div>

            <div className="flex gap-6">
                
                {/* YA NO usa Link, ahora abre el modal */}
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalAbierto(true)}
                >
                    Crear marca
                </Button>
            </div>
        </div>
    
        <DataTable
            data={brands}
            columns={brandsColumns}
        />

        {/* Modal */}
        {modalAbierto && (
            <div
                // Toma toda laa pantalla con fondo de opacidad negro, sii da clic por fuera se cierra el modal
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setModalAbierto(false)}
            >
                <div onClick={(e) => e.stopPropagation()}>
                    <BrandRegisterForm onClose={() => setModalAbierto(false)} />
                </div>
            </div>
        )}
    </div>
  )
}