import Input from "../shared/components/Input.jsx"
import { CreateUserPage } from "@/features/users";
import { CreteBrandPage } from "../features/brands/index.js";
<<<<<<< HEAD
import { CreateLoanPage } from "../features/loans/index.js";
import { CreatePermissionPage } from "../features/permissions/index.js";
=======
>>>>>>> 1e0fff203aba5ba74920f3cf44db478783d6fc0d

export default function App(){

    return(
        <div className="min-h-screen flex items-center justify-center">
<<<<<<< HEAD
        {/* <CreateUserPage /> */}
        {/* <CreteBrandPage /> */}
        {/* <CreateLoanPage /> */}
        <CreatePermissionPage />
=======
        <CreateUserPage />
        {/* <CreteBrandPage /> */}
>>>>>>> 1e0fff203aba5ba74920f3cf44db478783d6fc0d
    </div>
    );
};