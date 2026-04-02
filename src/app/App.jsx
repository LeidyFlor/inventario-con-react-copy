import Input from "../shared/components/Input.jsx"
import { CreateUserPage } from "@/features/users";
import { CreteBrandPage } from "../features/brands/index.js";

export default function App(){

    return(
        <div className="min-h-screen flex items-center justify-center">
        <CreateUserPage />
        {/* <CreteBrandPage /> */}
    </div>
    );
};