import DataTable from "@/shared/components/DataTable"
import { ReturnableColumns } from "../table/ReturnableColumns"
import { returnableMaterial } from "../data/returnableMaterial"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"


export default function ListReturnablePage() {

    return (

        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between ">
                {/* contenenedor del titulo y la linea */}
                <div className=" mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <ClipboardList className="text-brand" />
                        Listar Material Devolutivo
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>

                <div className="flex mb-3 md:mb-0 gap-6">

                    <Button
                        variant="secondary"
                        size="sm"
                    >
                        Reporte
                    </Button>

                    <Link to="/dashboard/returnable-material-create">
                        <Button
                            variant="primary"
                            size="sm"
                        >
                            Crear Material devolutivo
                        </Button>
                    </Link>

                </div>

            </div>


            <DataTable
                data={returnableMaterial}
                columns={ReturnableColumns}
            />

        </div>


    )
}
