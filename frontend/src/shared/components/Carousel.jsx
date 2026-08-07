import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButtonReal } from "@/shared";
import { imagesHero } from "../data/carousel/imagenes";

const slides = imagesHero

export default function Carousel() {
    //COntrola que imagen se muestra
    const [current, setCurrent] = useState(0);
    //Guarda la referanica del temporizador
    const timerRef = useRef(null);
    //Cambia la imagen que se muestra, el % hace que se convierta en un ciclo infinito
    const goTo = (idx) => {
        setCurrent((idx + slides.length) % slides.length);
    };

    //Temporarizador automático. SetINterval guarda referncia de timepo para impedir que el temporizador se duplique. Cada 4 segundps (4000) hace que avance a la siguiente imagen
    useEffect(() => {
        timerRef.current = setInterval(() => goTo(current + 1), 4000);
        // despues de pasar a la siguiente imagen resetea el temporizador
        return () => clearInterval(timerRef.current);
    }, [current]);

    return (
        // relative posiciona botones encima de las imagenes y overflow-hidden para acultar las imagenes que estan en fila
        <div className="relative w-full overflow-hidden rounded-3xl">
            {/* Track  translateX posiciona toda la fila de imagenes a la izquierda, y segun current va cambiando (el index), el porcentaje va cambiando mostrando las demas imagenes [0] = 0%. [1] = -100%. transition-transform duration-500 hace que la transicion ocurra en medio segundp*/}
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {slides.map((slide, i) => (
                    <div key={i} className="relative min-w-full">
                        <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-75 md:h-100 object-cover "
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-5 py-4">
                            <p className="text-white font-body text-h3">{slide.caption}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Flechas */}
                <IconButtonReal className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center`}
                    onClick={() => goTo(current + 1)} arialLabel="Siguiente" variant="secundary">

                    <ChevronRight />

                </IconButtonReal>

                <IconButtonReal className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center`}
                    onClick={() => goTo(current - 1)} arialLabel="Anterior" variant="secundary">

                    <ChevronLeft />

                </IconButtonReal>
          
           
            {/* Puntos */}
            <div className="flex justify-center gap-2 mt-3">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`h-3 rounded-full transition-all duration-300 ${i === current ? "w-3 bg-brand-hover" : "w-5 bg-brand-soft cursor-pointer"
                            }`}
                        aria-label={`Ir a la imagen ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}