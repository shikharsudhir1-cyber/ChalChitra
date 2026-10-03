import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

// The real protection is on the server (requireAdmin); this only hides the UI.
export function AdminRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return user.role === "ADMIN" ? children : <Navigate to="/" />;
}