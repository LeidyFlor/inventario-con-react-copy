import Input from "../shared/components/Input.jsx"
import { CreateUserPage, EditUserPage } from "@/features/users";
import { CreteBrandPage } from "../features/brands/index.js";
import { CreateLoanPage } from "../features/loans/index.js";
import { CreateTaskPage } from "../features/tasks/index.js";
import { CreateConsumablePage, EditConsumablePage } from "@/features/consumable-material";
import CreateReturnablePage from "../features/returnable-material/pages/CreateReturnablePage.jsx";


export default function App(){

    return(
        <div className="min-h-screen flex items-center justify-center">
        {/* <CreateUserPage /> */}
            {/* <EditUserPage /> */}
            <EditConsumablePage />
        {/* <CreteBrandPage /> */}
        {/* <CreateLoanPage /> */}
        {/* <CreateTaskPage />   */}
        {/* <CreateConsumablePage /> */}
        {/* <CreateReturnablePage /> */}
    </div>
    );
};