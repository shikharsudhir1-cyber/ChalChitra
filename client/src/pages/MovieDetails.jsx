import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MovieDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const [m, setM] = useState(null);
    const [eligible, setEligible] = useState([]);
    const [f, setF] = useState({ theatre_id: "", rating: 5, review_text: "" });
    const [msg, setMsg] = useState("");

    const load = () => api(`/movies/${id}`).then(setM).catch((e) => setMsg(e.message));
    useEffect(() => {
        load();
        if (user)
            api("/reviews/eligible").then((r) => {
                const mine = r.filter((x) => String(x.movie_id) === id);
                setEligible(mine);
                if (mine[0]) setF((p) => ({ ...p, theatre_id: mine[0].theatre_id }));
            }).catch(() => { });
    }, [id, user]);

    async function submit() {
        try {
            await api("/reviews", {
                method: "POST", body: {
                    movie_id: Number(id), theatre_id: Number(f.theatre_id),
                    rating: Number(f.rating), review_text: f.review_text
                }
            });
            setMsg("Review saved!"); load();
        } catch (e) { setMsg(e.message); }
    }

    if (!m) return <p>{msg || "Loading…"}</p>;
    return (
        <>
            <div className="card">
                <h2>{m.movie_name}</h2>
                <p>{m.genre} · {m.language} · {m.duration_min} min · Released {m.release_date ?? "—"}</p>
                <Link to={`/movies/${id}/shows`}><button>Book Tickets</button></Link>
            </div>

            <h3>Reviews</h3>
            {m.reviews.length === 0 && <p>No reviews yet.</p>}
            {m.reviews.map((r, i) => (
                <div className="card" key={i}>
                    <b>{r.name}</b> · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · <small>at {r.theatre_name}</small>
                    <p>{r.review_text}</p>
                </div>
            ))}

            {user && eligible.length > 0 && (
                <div className="card form">
                    <h3>Rate this movie &amp; theatre</h3>
                    <select value={f.theatre_id} onChange={(e) => setF({ ...f, theatre_id: e.target.value })}>
                        {eligible.map((x) => <option key={x.theatre_id} value={x.theatre_id}>{x.theatre_name}</option>)}
                    </select>
                    <select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && "s"}</option>)}
                    </select>
                    <textarea rows="3" placeholder="Write your review…" value={f.review_text}
                        onChange={(e) => setF({ ...f, review_text: e.target.value })} />
                    <button onClick={submit}>Submit review</button>
                    {msg && <p>{msg}</p>}
                </div>
            )}
            {user && eligible.length === 0 && <p><small>Book and pay for this movie to leave a review.</small></p>}
        </>
    );
}