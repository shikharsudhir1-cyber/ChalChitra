import { createContext, useContext, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

    async function authenticate(path, body) {
        const data = await api(path, { method: "POST", body });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    }
    const login = (email, password) => authenticate("/auth/login", { email, password });
    const register = (form) => authenticate("/auth/register", form);
    const logout = () => { localStorage.clear(); setUser(null); };

    return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}