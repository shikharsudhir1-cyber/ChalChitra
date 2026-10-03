import { useEffect, useState } from "react";
import CrudManager from "../components/CrudManager.jsx";
import { api } from "../services/api.js";

export default function ManageShows() {
    const [movies, setMovies] = useState([]);
    const [screens, setScreens] = useState([]);
    const [slots, setSlots] = useState([]);
    useEffect(() => {
        api("/movies").then(setMovies);
        api("/screens").then(setScreens);
        api("/time-slots").then(setSlots);
    }, []);

    return (
        <CrudManager title="Manage Shows" endpoint="/shows" listPath="/shows?includePast=1" idKey="show_id"
            columns={[
                { key: "show_id", label: "ID" }, { key: "movie_name", label: "Movie" },
                { key: "theatre_name", label: "Theatre" }, { key: "screen_name", label: "Screen" },
                { key: "show_date", label: "Date" }, { key: "slot_label", label: "Slot" },
                { key: "base_price", label: "Price" },
            ]}
            fields={[
                { name: "movie_id", label: "Movie", type: "select", options: movies.map((m) => ({ value: m.movie_id, label: m.movie_name })) },
                { name: "screen_id", label: "Screen", type: "select", options: screens.map((s) => ({ value: s.screen_id, label: `${s.theatre_name} – ${s.screen_name}` })) },
                { name: "slot_id", label: "Time slot", type: "select", options: slots.map((s) => ({ value: s.slot_id, label: `${s.slot_label} (${s.start_time})` })) },
                { name: "show_date", label: "Date", type: "date" },
                { name: "base_price", label: "Base price (₹)", type: "number" },
            ]} />
    );
}