import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../services/api.js";

export default function EPass() {
    const { bookingId } = useParams();
    const [p, setP] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { api(`/epass/${bookingId}`).then(setP).catch((e) => setErr(e.message)); }, [bookingId]);
    if (err) return <p className="error">{err}</p>;
    if (!p) return <p>Loading…</p>;
    return (
        <div className="card form">
            <h2>🎟️ E-Pass</h2>
            <h3>{p.movie_name}</h3>
            <p>{p.theatre_name} · {p.screen_name}</p>
            <p>{p.show_date.slice(0, 10)} · {p.slot_label}</p>
            <p>Seats: <b>{p.seats}</b> · Paid ₹{p.total_amount}</p>
            <QRCodeSVG value={p.qr_code} size={180} />
            <small>{p.qr_code}</small>
        </div>
    );
}