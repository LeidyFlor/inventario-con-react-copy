import StatusSwitch from "./StatusSwitch";
import Button from "./Button";

//Plantilla reutilizable para visualizar modulo usuarios y materiales (consumo & devolutivo)
export default function ViewPageTemplate({
    // Encabezado
    title,
    icon,

    // Acciones opcionales arriba a la derecha
    topActions,        // cualquier JSX — botones, links, etc.

    // Panel izquierdo
    image,
    imageAlt,
    name,
    description,       // opcional

    // Estado y editar
    estado,
    onToggleEstado,
    onEdit,

    // Panel derecho
    children,          // aquí va el ViewDetailCard u otro contenido
}) {
    return (
        <div className=" flex flex-col place-items-center justify-items-center gap-4 w-full">
            {/* contenedor verde */}
            <div className="bg-gradient-container-green border-4 border-border-green-container p-6 rounded-4xl w-fit md:w-full place-self-center">

            {/* Encabezado, icon y title se reemplazan */}
                <div className="flex md:items-start flex-col md:flex-row md:justify-between place-items-center">
                <div className="mb-3 max-w-max">
                    <h3 className="flex gap-2 text-gradient-title text-h3 pb-0.5">{icon} {title}</h3>
                        
                    <div className="h-0.5 bg-gradiant-title-line"></div>
                </div>

                {/* Botones opcionales arriba derecha */}
                {topActions && (
                    <div className="flex gap-3 mb-4 md:mb-0">
                        {topActions}
                    </div>
                )}
            </div>

            {/* Contenido principal */}
            <div className="flex flex-col lg:grid lg:grid-flow-col-dense gap-2 lg:gap-0">

                {/* Panel izquierdo */}
                <div className="flex flex-col items-center gap-4 justify-center">
                        {/* Imagen o inicial */}
                        {image ? (
                            <img
                                src={image}
                                alt={imageAlt ?? name}
                                className="w-48 h-48 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-surface border-2 border-input-border">
                                <span className="text-2xl font-body text-text-primary">
                                    {name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                    {/* Nombre */}
                    {name && (
                        <span className="text-center border-b-2 border-border rounded-t-xl text-body font-semibold text-text-secundary placeholder-text-primary">{name}</span>
                    )}

                    {/* Descripción opcional */}
                    {description && (
                            <p className=" flex text-text-secondary text-sm max-w-95 text-left border-2 rounded-xl border-border-strong bg-background p-4">
                            {description}
                        </p>
                    )}

                    {/* Estado y Editar */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Estado: </span>
                            {estado == true ? "Activo" : "Inactivo"}
                        </div>
                        <Button variant="warning" size={"sm"} onClick={onEdit}>
                            Editar
                        </Button>
                    </div>
                </div>

                {/* Panel derecho — contenido variable por módulo */}
                <div className="gap-4 min-w-0 place-items-center">
                    {children}
                </div>

            </div>
            </div>
        </div>
    );
}