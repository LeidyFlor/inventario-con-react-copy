import DataTable from "@/shared/components/DataTable"
import { usersColumns } from "../table/usersColumns"
import { users } from "../data/users"
import { Button } from "@/shared/"
import { Link } from "react-router-dom"


export default function ListUserPage() {


  return (      
    
    <div className="p-6">
        <div className="flex justify-between mb-6"> 
            <h1 className="text-xl font-semibold mb-4">Usuarios</h1>

            <div className="flex gap-6">


                <Link to="/dashboard">
                    <Button
                        variant="primary"
                        size="sm"
                    >
                        Crear Usuario
                    </Button>
                </Link>

                    <Button
                        variant="secondary" 
                        size="sm"
                    >
                        Reporte
                    </Button>


            </div>

        </div>
    

        <DataTable
            data={users}
            columns={usersColumns}
        />

    </div>


  )
}
