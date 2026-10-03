import { Link, useLocation, useParams } from "react-router-dom";

export default function BookingSuccess() {
    const { bookingId } = useParams();
    const { state } = useLocation();
    const p = state?.payment;
    return (
        <div className="card form">
            <h2>✅ Booking confirmed!</h2>
            <p>Booking #{bookingId} is confirmed.</p>
            {p && <p>Paid ₹{p.amount} via {p.payment_method}<br /><small>Ref: {p.transaction_ref}</small></p>}
            <Link to={`/epass/${bookingId}`}><button>View E-Pass</button></Link>
            <Link to="/my-bookings">Go to My Bookings</Link>
        </div>
    );
}