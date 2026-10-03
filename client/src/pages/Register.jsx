import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [f, setF] = useState({ name: "", age: "", email: "", password: "" });
    const [err, setErr] = useState("");
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    async function submit() {
        try { await register({ ...f, age: Number(f.age) || null }); nav("/"); }
        catch (e) { setErr(e.message); }
    }
    return (
        <div className="card form">
            <h2>Create account</h2>
            <input placeholder="Name" value={f.name} onChange={set("name")} />
            <input placeholder="Age" type="number" value={f.age} onChange={set("age")} />
            <input placeholder="Email" value={f.email} onChange={set("email")} />
            <input placeholder="Password (min 6 chars)" type="password" value={f.password} onChange={set("password")} />
            {err && <p className="error">{err}</p>}
            <button onClick={submit}>Register</button>
            <Link to="/login">Already have an account? Login</Link>
        </div>
    );
}