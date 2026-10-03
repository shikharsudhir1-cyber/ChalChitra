import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function ManageSeats() {
    const [screens, setScreens] = useState([]);
    const [screenId, setScreenId] = useState("");
    const [seats, setSeats] = useState([]);
    const [f, setF] = useState({ seat_number: "", seat_location: "REGULAR" });
    const [err, setErr] = useState("");

    useEffect(() => {
        api("/screens").then((s) => { setScreens(s); if (s[0]) setScreenId(s[0].screen_id); });
    }, []);
    const load = () => screenId && api(`/seats?screenId=${screenId}`).then(setSeats).catch((e) => setErr(e.message));
    useEffect(() => { load(); }, [screenId]);

    const run = async (fn) => { try { await fn(); setErr(""); load(); } catch (e) { setErr(e.message); } };
    const toggle = (s) => run(() => api(`/seats/${s.seat_id}`, { method: "PUT", body: { is_offline_reserved: !s.is_offline_reserved } }));
    const remove = (s) => confirm(`Delete seat ${s.seat_number}?`) && run(() => api(`/seats/${s.seat_id}`, { method: "DELETE" }));
    const add = () => run(() => api("/seats", { method: "POST", body: { screen_id: Number(screenId), ...f } }));

    return (
        <>
            <h2>Manage Seats</h2>
            <div className="card row-left">
                <select value={screenId} onChange={(e) => setScreenId(e.target.value)}>
                    {screens.map((s) => <option key={s.screen_id} value={s.screen_id}>{s.theatre_name} – {s.screen_name}</option>)}
                </select>
                <input placeholder="New seat (e.g. E1)" value={f.seat_number} onChange={(e) => setF({ ...f, seat_number: e.target.value })} />
                <select value={f.seat_location} onChange={(e) => setF({ ...f, seat_location: e.target.value })}>
                    <option>REGULAR</option><option>PREMIUM</option><option>VIP</option>
                </select>
                <button onClick={add}>Add seat</button>
            </div>
            {err && <p className="error">{err}</p>}
            <div className="card table-wrap">
                <table>
                    <thead><tr><th>Seat</th><th>Category</th><th>Offline reserved</th><th></th></tr></thead>
                    <tbody>
                        {seats.map((s) => (
                            <tr key={s.seat_id}>
                                <td>{s.seat_number}</td><td>{s.seat_location}</td><td>{s.is_offline_reserved ? "Yes" : "No"}</td>
                                <td className="actions">
                                    <button className="small" onClick={() => toggle(s)}>{s.is_offline_reserved ? "Release" : "Reserve offline"}</button>
                                    <button className="small danger" onClick={() => remove(s)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}