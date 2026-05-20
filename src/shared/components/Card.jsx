export default function Card({ product }) {

    const { title, price, description, image } = product;
    return (
        <div
            className="
            w-full
            text-text-inverse
            dark:bg-neutral-950/80
            backdrop-blur-[2px]
            shadow-lg
            rounded-2xl
            overflow-hidden
            hover:shadow-black
            transition-shadow duration-700
            "
        >
            <img
                src={image}
                alt={title}
                className="w-full h-48 object-contain"
            />

            <div className="p-5 space-y-3">
                {/* Titulo de la card */}
                <h2 className="text-h2 font-heading place-self-center">
                    {title}
                </h2>

                {/* La descripcion */}
                <p className="text-body">
                    {description}
                </p>
                {/* Precio del producto */}
                <p className="text-h2 font-heading text-brand">
                    {/* 👇 permite la separacion en punto de miles */}
                    ${price.toLocaleString()}
                </p>
            </div>
        </div>
    )
}