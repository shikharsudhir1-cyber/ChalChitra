import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    return (
        <nav className="nav">
            <Link to="/" className="logo">🎬 ChalChitra</Link>
            <div className="links">
                <Link to="/">Movies</Link>
                <Link to="/theatres">Theatres</Link>
                {user && <Link to="/my-bookings">My Bookings</Link>}
                {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
                {user ? (
                    <>
                        <Link to="/profile">{user.name}</Link>
                        <button onClick={() => { logout(); nav("/"); }}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}