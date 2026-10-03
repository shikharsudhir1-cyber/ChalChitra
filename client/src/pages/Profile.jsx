import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function Profile() {
    const [p, setP] = useState(null);
    const [f, setF] = useState({ name: "", age: "", currentPassword: "", newPassword: "" });
    const [msg, setMsg] = useState("");

    const load = () => api("/profile").then((d) => { setP(d); setF((x) => ({ ...x, name: d.name, age: d.age ?? "" })); });
    useEffect(() => { load().catch((e) => setMsg(e.message)); }, []);

    async function save() {
        try {
            const body = { name: f.name, age: Number(f.age) || null };
            if (f.newPassword) { body.currentPassword = f.currentPassword; body.newPassword = f.newPassword; }
            await api("/profile", { method: "PUT", body });
            const u = JSON.parse(localStorage.getItem("user"));
            localStorage.setItem("user", JSON.stringify({ ...u, name: f.name }));
            setMsg("Profile updated"); setF((x) => ({ ...x, currentPassword: "", newPassword: "" })); load();
        } catch (e) { setMsg(e.message); }
    }
    if (!p) return <p>{msg || "Loading…"}</p>;
    return (
        <div className="card form">
            <h2>My Profile</h2>
            <p>{p.email} · {p.role}<br />Confirmed bookings: <b>{p.confirmed_bookings}</b> · Total spent: <b>₹{p.total_spent}</b></p>
            <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input placeholder="Age" type="number" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
            <input placeholder="Current password (only to change it)" type="password" value={f.currentPassword}
                onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
            <input placeholder="New password" type="password" value={f.newPassword}
                onChange={(e) => setF({ ...f, newPassword: e.target.value })} />
            <button onClick={save}>Save</button>
            {msg && <p>{msg}</p>}
        </div>
    );
}