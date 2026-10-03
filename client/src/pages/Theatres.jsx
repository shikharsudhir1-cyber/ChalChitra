import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function Theatres() {
    const [list, setList] = useState([]);
    useEffect(() => { api("/theatres").then(setList).catch(console.error); }, []);
    return (
        <>
            <h2>Theatres</h2>
            <div className="grid">
                {list.map((t) => (
                    <div className="card" key={t.theatre_id}>
                        <h3>{t.theatre_name}</h3>
                        <p>📍 {t.location} · {t.screen_count} screen(s)</p>
                        <p>⭐ {t.avg_rating ?? "No ratings"} {t.review_count > 0 && `(${t.review_count})`}</p>
                        <Link to={`/theatres/${t.theatre_id}`}><button>View</button></Link>
                    </div>
                ))}
            </div>
        </>
    );
}