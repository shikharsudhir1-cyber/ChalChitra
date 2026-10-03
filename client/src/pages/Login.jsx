import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
    const { login, register } = useAuth();
    const nav = useNavigate();
    const [isReg, setIsReg] = useState(false);
    const [f, setF] = useState({ email: "", password: "", name: "", age: "" });
    const [err, setErr] = useState("");
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    async function submit() {
        try {
            isReg ? await register({ ...f, age: Number(f.age) || null }) : await login(f.email, f.password);
            nav("/");
        } catch (e) { setErr(e.message); }
    }
    return (
        <div className="card form">
            <h2>{isReg ? "Register" : "Login"}</h2>
            {isReg && <input placeholder="Name" value={f.name} onChange={set("name")} />}
            {isReg && <input placeholder="Age" type="number" value={f.age} onChange={set("age")} />}
            <input placeholder="Email" value={f.email} onChange={set("email")} />
            <input placeholder="Password" type="password" value={f.password} onChange={set("password")} />
            {err && <p className="error">{err}</p>}
            <button onClick={submit}>{isReg ? "Create account" : "Login"}</button>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsReg(!isReg); setErr(""); }}>
                {isReg ? "Have an account? Login" : "New here? Register"}
            </a>
        </div>
    );
}