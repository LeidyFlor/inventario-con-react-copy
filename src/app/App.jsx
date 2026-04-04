import Input from "../shared/components/Input.jsx"
import { CreateUserPage } from "@/features/users";
import { CreteBrandPage } from "../features/brands/index.js";
import { CreateLoanPage } from "../features/loans/index.js";
import { CreatePermissionPage } from "../features/permissions/index.js";

export default function App(){

    return(
        <div className="min-h-screen flex items-center justify-center">
        {/* <CreateUserPage /> */}
        {/* <CreteBrandPage /> */}
        {/* <CreateLoanPage /> */}
        <CreatePermissionPage />
    </div>
    );
};