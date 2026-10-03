import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function TheatreDetails() {
    const { id } = useParams();
    const [t, setT] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { api(`/theatres/${id}`).then(setT).catch((e) => setErr(e.message)); }, [id]);
    if (err) return <p className="error">{err}</p>;
    if (!t) return <p>Loading…</p>;
    return (
        <>
            <div className="card">
                <h2>{t.theatre_name}</h2>
                <p>📍 {t.location} · ⭐ {t.avg_rating ?? "No ratings"}</p>
                <p>Screens: {t.screens.map((s) => `${s.screen_name} (${s.total_seats} seats)`).join(", ") || "none"}</p>
            </div>
            <h3>Reviews</h3>
            {t.reviews.length === 0 && <p>No reviews yet.</p>}
            {t.reviews.map((r, i) => (
                <div className="card" key={i}>
                    <b>{r.name}</b> · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · <small>watched {r.movie_name}</small>
                    <p>{r.review_text}</p>
                </div>
            ))}
        </>
    );
}