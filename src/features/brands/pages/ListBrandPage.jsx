import DataTable from "@/shared/components/DataTable"
import { brandsColumns } from "../table/brandsColumns"
import { brands } from "../data/brands"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"


export default function ListUserPage() {


  return (      
    
    <div className="p-6">
        <div className="flex justify-between "> 
              {/* contenenedor del titulo y la linea */}
              <div className=" mb-6 max-w-max">
                  <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                      <ClipboardList className="text-brand" />
                      Listar usuarios
                  </h1>{/*linea degradada del titulo*/}
                  <div className="h-0.5 bg-gradiant-title-line"></div>

              </div>

            <div className="flex gap-6">



                    <Button
                        variant="secondary" 
                        size="sm"
                    >
                        Reporte
                    </Button>

                <Link to="/dashboard">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear marca
                    </Button>
                </Link>

            </div>

        </div>
    

        <DataTable
            data={brands}
            columns={brandsColumns}
        />

    </div>


  )
}
