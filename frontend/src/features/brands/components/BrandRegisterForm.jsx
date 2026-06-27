    import { Input, Button, IconButton } from "@/shared"
import { Tags } from "lucide-react";

export default function BrandRegisterForm({ onClose }) {
    const handleBrand = (e) => {
        console.log("Marca: ", e.target.value);
    }

    return(
        <div className="flex flex-col items-center justify-center relative">
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit place-self-center">
                <div className="mb-6 max-w-max">
                    <h1 className="flex gap-2 text-gradient-title text-h3 pb-0.5">
                        <Tags className="text-brand" />
                        Registro de marca
                    </h1>
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                <div className="flex flex-col items-center gap-5">
                    <Input
                        placeholder="Nombre de la marca"
                        label="Agregar marca"
                        onChange={handleBrand}
                        name="brandName"
                    />
                    {/* Llama onClose en vez de navegar */}
                    <IconButton onClick={onClose}>
                        Aceptar
                    </IconButton>
                </div>
            </div>
        </div>
    );
}