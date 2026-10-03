import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [q, setQ] = useState("");
    useEffect(() => { api("/movies").then(setMovies).catch(console.error); }, []);
    const shown = movies.filter((m) => m.movie_name.toLowerCase().includes(q.toLowerCase()));
    return (
        <>
            <div className="row"><h2>Now Showing</h2>
                <input placeholder="Search movies…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="grid">
                {shown.map((m) => (
                    <div className="card" key={m.movie_id}>
                        <h3>{m.movie_name}</h3>
                        <p>{m.genre} · {m.language} · {m.duration_min} min</p>
                        <p>⭐ {m.avg_rating ?? "No ratings"} {m.review_count > 0 && `(${m.review_count})`}</p>
                        <div className="row-left">
                            <Link to={`/movies/${m.movie_id}`}><button className="ghost">Details</button></Link>
                            <Link to={`/movies/${m.movie_id}/shows`}><button>Book Tickets</button></Link>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}