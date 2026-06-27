// src/shared/components/ViewDetailCard.jsx

export default function ViewDetailCard({ fields = [] }) {
    return (
        <div className="flex flex-col gap-2 border-2 rounded-xl border-border-strong bg-background p-5 place-items-center w-fit">
            {fields.map((field, index) => (
                <div key={index} className="flex flex-col place-self-start md:flex-row gap-4">
                    <span className=" font-bold text-text-primary min-w-40">
                        {field.label}:
                    </span>
                    {/* En caso de un campo este muestra un - */}
                    <span className="text-text-primary">
                        {field.value ?? "—"}
                    </span>
                </div>
            ))}
        </div>
    );
}