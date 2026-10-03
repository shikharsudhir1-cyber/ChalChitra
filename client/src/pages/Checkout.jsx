import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function Checkout() {
    const { bookingId } = useParams();
    const { state } = useLocation();
    const nav = useNavigate();
    const [total, setTotal] = useState(state?.total ?? null);
    const [method, setMethod] = useState("UPI");
    const [err, setErr] = useState("");

    // opened from "My Bookings" (no router state)? fetch the amount
    useEffect(() => {
        if (total === null)
            api("/bookings/mine").then((l) => setTotal(l.find((b) => String(b.booking_id) === bookingId)?.total_amount ?? "—"));
    }, [bookingId]);

    async function pay() {
        try {
            const data = await api(`/bookings/${bookingId}/pay`, { method: "POST", body: { method } });
            nav(`/success/${bookingId}`, { state: { payment: data.payment } });
        } catch (e) { setErr(e.message); }
    }
    return (
        <div className="card form">
            <h2>Checkout</h2>
            <p>Booking #{bookingId} · Amount: <b>₹{total ?? "…"}</b></p>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {["UPI", "CARD", "NET_BANKING", "CASH"].map((m) => <option key={m}>{m}</option>)}
            </select>
            <button onClick={pay}>Pay Now (simulated)</button>
            {err && <p className="error">{err}</p>}
        </div>
    );
}