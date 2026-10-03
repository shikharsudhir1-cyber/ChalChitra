import { useEffect, useState } from "react";
import CrudManager from "../components/CrudManager.jsx";
import { api } from "../services/api.js";

export default function ManageTheatres() {
    const [theatres, setTheatres] = useState([]);
    const loadTheatres = () => api("/theatres").then(setTheatres);
    useEffect(() => { loadTheatres(); }, []);

    return (
        <>
            <CrudManager title="Manage Theatres" endpoint="/theatres" idKey="theatre_id" onChange={loadTheatres}
                columns={[{ key: "theatre_id", label: "ID" }, { key: "theatre_name", label: "Name" },
                { key: "location", label: "Location" }, { key: "screen_count", label: "Screens" }]}
                fields={[{ name: "theatre_name", label: "Theatre name" }, { name: "location", label: "Location" }]} />

            <CrudManager title="Manage Screens (seats are generated automatically)" endpoint="/screens" idKey="screen_id"
                columns={[{ key: "screen_id", label: "ID" }, { key: "theatre_name", label: "Theatre" },
                { key: "screen_name", label: "Screen" }, { key: "total_seats", label: "Seats" }]}
                fields={[
                    {
                        name: "theatre_id", label: "Theatre", type: "select",
                        options: theatres.map((t) => ({ value: t.theatre_id, label: t.theatre_name }))
                    },
                    { name: "screen_name", label: "Screen name" },
                    { name: "rows", label: "Rows (A, B, C…)", type: "number", createOnly: true },
                    { name: "seats_per_row", label: "Seats per row", type: "number", createOnly: true },
                ]} />
        </>
    );
}