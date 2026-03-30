import { Input } from "@/shared"

export default function UserRegisterForm() {

    // Handle eventos. onChange cada vez que se escribe. onBlur toma el valor cuando uno sale del campo

    const handleNameChange = (e) => {
        console.log("Nombre: ", e.target.value);
    }
    const handleEmailBlur = (e) => {
        console.log("Email: ", e.target.value);
    }


    return (
        <div>
            <h1 className="text-image-text-gradient text-2xl mb-6">
                Registro de usuario
            </h1>
            <form className="grid grid-cols-1 items-center gap-6 ">
                {/* Inputs */}
                <div className="grid grid-cols-2 gap-6 my-0 mx-auto">
                    <Input
                        placeholder="Numero de documento"
                    />
                    <Input
                        placeholder="Ingrese su nombre"
                        onChange={handleNameChange}
                    />
                    <Input
                        placeholder="Direccion"
                    />
                    <Input
                        placeholder="Número telefónico"
                        type="tel"
                    />
                    <Input
                        placeholder="Número telefónico 2"
                        type="tel"
                    />
                    <Input
                        placeholder="Correo electrónico"
                        type="email"
                        onBlur={handleEmailBlur}
                    />
                    <Input
                        placeholder="Confirmar correo electrónico"
                        type="email"
                        onBlur={handleEmailBlur}
                    />
                    <Input
                        placeholder="Correo inatitucional"
                        type="email"
                        onBlur={handleEmailBlur}
                    />
                    <Input
                        placeholder="Ingrese su contraseña"
                        type="password"
                    />

                    {/* Acciones */}
                    <div className="flex items-end justify-end gap-12">
                        {/* <Button
                            variant="secondary"
                            size="sm"
                        >
                            Cancelar
                        </Button>

                        <Button
                            variant="primary"
                            size="md"
                        >
                            Guardar
                        </Button> */}

                    </div>
                </div>


            </form>

        </div>
    )
};