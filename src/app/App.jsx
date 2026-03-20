import Input from "../shared/components/Input.jsx"

export default function App(){

    return(
        <div className="min-h-screen bg-green-800 flex items-center justify-center">
      <h1 className="text-white text-4xl font-bold">
        Con rico programar con Tailwind funciona full...
      </h1>

      <Input 
        label ="Nombre"
        placeholder="Ingrese su nombre"
      />
    </div>
    );
};