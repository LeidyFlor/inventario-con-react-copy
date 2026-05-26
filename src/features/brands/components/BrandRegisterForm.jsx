import { Input, Button, IconButton } from "@/shared"
import { Tags } from "lucide-react";
import { Link } from "react-router-dom"

export default function BrandRegisterForm(){
    const handleBrand = (e) => {
        console.log("Marca: ", e.target.value);
    }

    return(
        <div className="flex flex-col items-center justify-center min-h-screen relative">

            {/* Contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">

                {/* Título con línea degradada */}
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Tags className="text-brand" />
                        Registro de marca
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                {/* Contenido centrado */}
                <div className="flex flex-col items-center gap-5">
                    <Input
                        placeholder="Nombre de la marca"
                        label="Agregar marca"
                        onChange={handleBrand}
                        name="brandName"
                    />
                    <Link to="brand-list">
                        <IconButton>
                            Aceptar
                        </IconButton>
                    </Link>
                </div>

            </div>

        </div>
    );
}