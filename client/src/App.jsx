import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Movies from "./pages/Movies.jsx";
import MovieDetails from "./pages/MovieDetails.jsx";
import Theatres from "./pages/Theatres.jsx";
import TheatreDetails from "./pages/TheatreDetails.jsx";
import Shows from "./pages/Shows.jsx";
import SeatSelection from "./pages/SeatSelection.jsx";
import Checkout from "./pages/Checkout.jsx";
import BookingSuccess from "./pages/BookingSuccess.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import EPass from "./pages/EPass.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManageMovies from "./pages/ManageMovies.jsx";
import ManageTheatres from "./pages/ManageTheatres.jsx";
import ManageSeats from "./pages/ManageSeats.jsx";
import ManageShows from "./pages/ManageShows.jsx";
import ManageCoupons from "./pages/ManageCoupons.jsx";
import ManageDiscounts from "./pages/ManageDiscounts.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/movies/:id/shows" element={<Shows />} />
          <Route path="/theatres" element={<Theatres />} />
          <Route path="/theatres/:id" element={<TheatreDetails />} />

          <Route path="/shows/:id/seats" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
          <Route path="/checkout/:bookingId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/success/:bookingId" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/epass/:bookingId" element={<ProtectedRoute><EPass /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/movies" element={<AdminRoute><ManageMovies /></AdminRoute>} />
          <Route path="/admin/theatres" element={<AdminRoute><ManageTheatres /></AdminRoute>} />
          <Route path="/admin/seats" element={<AdminRoute><ManageSeats /></AdminRoute>} />
          <Route path="/admin/shows" element={<AdminRoute><ManageShows /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><ManageCoupons /></AdminRoute>} />
          <Route path="/admin/discounts" element={<AdminRoute><ManageDiscounts /></AdminRoute>} />
        </Routes>
      </main>
    </>
  );
}