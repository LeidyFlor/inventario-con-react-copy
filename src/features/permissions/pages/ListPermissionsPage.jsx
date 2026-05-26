import  PermissionsForm  from "../components/PermissionsForm";
import { Settings } from "lucide-react";
export default function ListPermissionsPage(){
    return(
        <div className="flex flex-col lg:flex-row justify-between">
            {/* Grupos */}
            <div>
                {/* contenenedor del titulo y la linea */}
                <div className="mt-2 mb-6 max-w-max ">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5 place-items-center">
                        <Settings className="text-brand" />
                        Gestón de permisos
                    </h1>{/*linea degradada del titulo*/}
                    <div className="h-0.5 bg-gradiant-title-line"></div>

                </div>
                <h1>Hola mundo</h1>
            </div>
            {/* Listar/editar permisos */}
            <PermissionsForm
                // initialPermissions={grupoSeleccionado.permisos}
                initialPermissions={[]}
                onSave={(permisos) => console.log("guardar:", permisos)}
            />
        </div>
    )
}