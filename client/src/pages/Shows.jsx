import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function Shows() {
    const { id } = useParams();
    const [shows, setShows] = useState([]);
    useEffect(() => { api(`/shows?movieId=${id}`).then(setShows); }, [id]);
    return (
        <>
            <h2>Available Shows</h2>
            {shows.length === 0 && <p>No upcoming shows.</p>}
            {shows.map((s) => (
                <div className="card row" key={s.show_id}>
                    <div>
                        <b>{s.theatre_name}</b> ({s.location}) – {s.screen_name}<br />
                        {s.show_date.slice(0, 10)} · {s.slot_label} {s.start_time} · ₹{s.base_price}
                    </div>
                    <Link to={`/shows/${s.show_id}/seats`}><button>Select Seats</button></Link>
                </div>
            ))}
        </>
    );
}