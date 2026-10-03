import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function SeatSelection() {
    const { id } = useParams();
    const nav = useNavigate();
    const [seats, setSeats] = useState([]);
    const [offers, setOffers] = useState([]);
    const [picked, setPicked] = useState([]);
    const [coupon, setCoupon] = useState("");
    const [couponMsg, setCouponMsg] = useState("");
    const [err, setErr] = useState("");

    const load = () => api(`/shows/${id}/seats`).then(setSeats);
    useEffect(() => {
        load();
        api(`/discounts/show/${id}`).then(setOffers).catch(() => { });
    }, [id]);

    const toggle = (s) =>
        setPicked((p) => (p.includes(s.seat_id) ? p.filter((x) => x !== s.seat_id) : [...p, s.seat_id]));

    // group seats by row letter: A1, A2 ... -> row "A"
    const rows = {};
    [...seats]
        .sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }))
        .forEach((s) => { (rows[s.seat_number.match(/^[A-Za-z]+/)?.[0] ?? "?"] ??= []).push(s); });

    async function checkCoupon() {
        try {
            const c = await api("/coupons/validate", { method: "POST", body: { couponCode: coupon } });
            setCouponMsg(`✅ ${c.coupon_code}: ${c.discount_type === "FLAT" ? "₹" + c.discount_value : c.discount_value + "%"} off`);
        } catch (e) { setCouponMsg("❌ " + e.message); }
    }

    async function book() {
        try {
            const { booking } = await api("/bookings", {
                method: "POST", body: { showId: Number(id), seatIds: picked, couponCode: coupon || undefined },
            });
            nav(`/checkout/${booking.booking_id}`, { state: { total: booking.total_amount } });
        } catch (e) { setErr(e.message); load(); setPicked([]); }
    }

    return (
        <>
            <h2>Select Seats</h2>
            {offers.length > 0 && (
                <div className="card">🎁 Offers: {offers.map((o) =>
                    `${o.discount_name} (${o.discount_type === "FLAT" ? "₹" + o.discount_value : o.discount_value + "%"} off${o.seat_number ? " on " + o.seat_number : ""})`
                ).join(" · ")}</div>
            )}
            <div className="screen">SCREEN</div>
            <div className="seat-map">
                {Object.entries(rows).map(([row, list]) => (
                    <div className="seat-row" key={row}>
                        <b className="row-label">{row}</b>
                        {list.map((s) => (
                            <button key={s.seat_id} disabled={s.is_taken}
                                title={s.seat_location}
                                className={`seat ${s.is_taken ? "taken" : picked.includes(s.seat_id) ? "picked" : ""}`}
                                onClick={() => toggle(s)}>{s.seat_number}</button>
                        ))}
                    </div>
                ))}
            </div>
            <p className="legend"><span className="dot free" /> Free <span className="dot sel" /> Selected <span className="dot sold" /> Taken</p>
            <div className="row-left">
                <input placeholder="Coupon code (e.g. WELCOME50)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                <button className="ghost" disabled={!coupon} onClick={checkCoupon}>Check</button>
                <button disabled={!picked.length} onClick={book}>Proceed ({picked.length} seats)</button>
            </div>
            {couponMsg && <p>{couponMsg}</p>}
            {err && <p className="error">{err}</p>}
        </>
    );
}