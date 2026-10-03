import { useEffect, useState } from "react";
import CrudManager from "../components/CrudManager.jsx";
import { api } from "../services/api.js";

export default function ManageDiscounts() {
    const [shows, setShows] = useState([]);
    useEffect(() => { api("/shows?includePast=1").then(setShows); }, []);

    return (
        <CrudManager title="Manage Discounts" endpoint="/discounts" idKey="discount_id"
            columns={[
                { key: "discount_id", label: "ID" }, { key: "show_label", label: "Show" },
                { key: "seat_number", label: "Seat" }, { key: "discount_name", label: "Name" },
                { key: "discount_type", label: "Type" }, { key: "discount_value", label: "Value" },
                { key: "valid_until", label: "Until" }, { key: "is_active", label: "Active" },
            ]}
            fields={[
                {
                    name: "show_id", label: "Show", type: "select",
                    options: shows.map((s) => ({ value: s.show_id, label: `${s.movie_name} | ${s.theatre_name} | ${s.show_date} ${s.slot_label}` }))
                },
                { name: "seat_id", label: "Seat ID (blank = whole show)", type: "number", hint: "optional" },
                { name: "discount_name", label: "Name" },
                {
                    name: "discount_type", label: "Type", type: "select",
                    options: [{ value: "FLAT", label: "FLAT (₹)" }, { value: "PERCENT", label: "PERCENT (%)" }]
                },
                { name: "discount_value", label: "Value", type: "number" },
                { name: "valid_from", label: "Valid from", type: "date" },
                { name: "valid_until", label: "Valid until", type: "date" },
                { name: "is_active", label: "Active", type: "checkbox" },
            ]} />
    );
}