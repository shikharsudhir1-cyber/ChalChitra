import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function MyBookings() {
    const [list, setList] = useState([]);
    const [err, setErr] = useState("");
    useEffect(() => { api("/bookings/mine").then(setList).catch((e) => setErr(e.message)); }, []);

    const expired = (b) => b.booking_status === "PENDING" && Date.now() - new Date(b.booking_time) > 10 * 60000;
    return (
        <>
            <h2>My Bookings</h2>
            {err && <p className="error">{err}</p>}
            {list.length === 0 && <p>No bookings yet.</p>}
            {list.map((b) => (
                <div className="card row" key={b.booking_id}>
                    <div>
                        <b>{b.movie_name}</b> — {b.theatre_name}<br />
                        {b.show_date} · {b.slot_label} · Seats: {b.seats} · ₹{b.total_amount}<br />
                        <span className={`tag ${expired(b) ? "CANCELLED" : b.booking_status}`}>
                            {expired(b) ? "EXPIRED" : b.booking_status}
                        </span>
                    </div>
                    {b.booking_status === "CONFIRMED" && <Link to={`/epass/${b.booking_id}`}><button>E-Pass</button></Link>}
                    {b.booking_status === "PENDING" && !expired(b) && <Link to={`/checkout/${b.booking_id}`}><button>Pay now</button></Link>}
                </div>
            ))}
        </>
    );
}