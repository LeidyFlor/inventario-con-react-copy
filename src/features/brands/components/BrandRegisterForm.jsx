import { Input, Button, IconButton } from "@/shared"


export default function BrandRegisterForm(){
    const handleBrand = (e) => {
        console.log("Marca: ", e.target.value);
    }

    return(
        <div className="flex flex-col justify-start items-start gap-5">
            <Button
                variant="secondary"
                size="sm"
            >
                Atrás
            </Button>
            <div className="flex flex-col justify-end items-end gap-5">
                <Input
                    placeholder ="Escriba la marca"
                    label = "Agregar marca"
                    onChange={handleBrand}
                    name="marca"
                >
                </Input>
                <IconButton>
                    Aceptar
                </IconButton>

            </div>
            
        </div>
    );
}