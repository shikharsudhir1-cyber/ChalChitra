import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function AdminDashboard() {
    const [s, setS] = useState(null);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [err, setErr] = useState("");

    useEffect(() => {
        Promise.all([api("/admin/stats"), api("/admin/users"), api("/admin/bookings")])
            .then(([a, b, c]) => { setS(a); setUsers(b); setBookings(c); })
            .catch((e) => setErr(e.message));
    }, []);

    if (err) return <p className="error">{err}</p>;
    if (!s) return <p>Loading…</p>;
    const stat = (label, v) => <div className="card stat" key={label}><h2>{v}</h2><small>{label}</small></div>;
    return (
        <>
            <h2>Admin Dashboard</h2>
            <div className="row-left wrap">
                {[["movies", "Movies"], ["theatres", "Theatres & Screens"], ["seats", "Seats"],
                ["shows", "Shows"], ["coupons", "Coupons"], ["discounts", "Discounts"]].map(([p, l]) =>
                    <Link key={p} to={`/admin/${p}`}><button>{l}</button></Link>)}
            </div>
            <div className="grid">
                {stat("Users", s.users)}{stat("Movies", s.movies)}{stat("Theatres", s.theatres)}
                {stat("Upcoming shows", s.upcoming_shows)}{stat("Confirmed bookings", s.confirmed_bookings)}
                {stat("Revenue", "₹" + s.revenue)}
            </div>

            <h3>Top movies by revenue</h3>
            <div className="card"><table><thead><tr><th>Movie</th><th>Bookings</th><th>Revenue</th></tr></thead>
                <tbody>{s.top_movies.map((m) => <tr key={m.movie_name}><td>{m.movie_name}</td><td>{m.bookings}</td><td>₹{m.revenue}</td></tr>)}
                    {s.top_movies.length === 0 && <tr><td colSpan="3">No paid bookings yet.</td></tr>}</tbody></table></div>

            <h3>Users</h3>
            <div className="card table-wrap"><table><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Bookings</th></tr></thead>
                <tbody>{users.map((u) => <tr key={u.email}><td>{u.email}</td><td>{u.name}</td><td>{u.role}</td><td>{u.bookings}</td></tr>)}</tbody></table></div>

            <h3>Recent bookings</h3>
            <div className="card table-wrap"><table><thead><tr><th>#</th><th>User</th><th>Movie</th><th>Theatre</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{bookings.map((b) => <tr key={b.booking_id}><td>{b.booking_id}</td><td>{b.user_email}</td><td>{b.movie_name}</td>
                    <td>{b.theatre_name}</td><td>{b.show_date}</td><td>₹{b.total_amount}</td><td>{b.booking_status}</td></tr>)}</tbody></table></div>
        </>
    );
}