import ArrowRight from "@/assets/icons/arrow-right.svg?react"
// boton primary con flecha que consume el texto

export default function IconButton({ 
    size = "md", 
    children, 
    type = "button", 
    ...props }) {
    const sizes = {
        sm: `
        h-9 px-3
        before:absolute before:content-['']
        before:-inset-y-[6px] before:-inset-x-[0px]
    `,
        md: `
        h-12 px-4
        before:absolute before:content['']
        before:-inset-y-[6px] before:-inset-x-[0px]
    `,
        lg: `
        h-12 px-35
        before:absolute before:content['']
        before:-inset-y-[6px] before:-inset-x-[0px]
    `
    }
    return (
        <button 
            type={type}
            className={`group relative overflow-hidden inline-flex items-center rounded-xl bg-gradient-primary
            ${sizes[size]}

            `
            } 
            {...props}
        >

            {/* circulo que se explande en hover */}
            <span className="btn-primary-icon absolute left-1 flex items-center justify-center bg-white rounded-xl z-10">
                <ArrowRight className="w-5 h-5 " />
            </span>

            {/* texto que se desvanece */}
            <span className="btn-primary-label relative z-0 pl-8 pr-4 text-white font-medium">
                {children}
            </span>
        </button>
    )
}