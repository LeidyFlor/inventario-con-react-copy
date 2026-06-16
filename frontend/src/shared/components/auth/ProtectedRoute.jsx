// frontend/src/shared/components/auth/ProtectedRoute.jsx
//verifica si hay token en SessionStorage en el front, si no redirije al auth. NO actua como consultor con el token guardado en back, es decir slo verifica que exista un token en el front

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const token = sessionStorage.getItem("token");

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    return children;
}