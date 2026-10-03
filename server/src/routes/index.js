import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { register, login } from "../controllers/authController.js";
import { listMovies, getMovie, createMovie, updateMovie, deleteMovie } from "../controllers/movieController.js";
import { listShows, showSeats, listSlots, createShow, updateShow, deleteShow } from "../controllers/showController.js";
import { listTheatres, getTheatre, createTheatre, updateTheatre, deleteTheatre } from "../controllers/theatreController.js";
import { listScreens, createScreen, updateScreen, deleteScreen } from "../controllers/screenController.js";
import { listSeats, createSeat, updateSeat, deleteSeat } from "../controllers/seatController.js";
import { createBooking, payBooking, myBookings, getEPass } from "../controllers/bookingController.js";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } from "../controllers/couponController.js";
import { listDiscounts, showDiscounts, createDiscount, updateDiscount, deleteDiscount } from "../controllers/discountController.js";
import { listReviews, eligibleReviews, createReview } from "../controllers/reviewController.js";
import { myPayments, allPayments } from "../controllers/paymentController.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { stats, listUsers, listAllBookings } from "../controllers/adminController.js";

const r = Router();
const admin = [requireAuth, requireAdmin]; // admin-only = logged in AND role ADMIN

// auth + profile
r.post("/auth/register", register);
r.post("/auth/login", login);
r.get("/profile", requireAuth, getProfile);
r.put("/profile", requireAuth, updateProfile);

// movies
r.get("/movies", listMovies);
r.get("/movies/:id", getMovie);
r.post("/movies", ...admin, createMovie);
r.put("/movies/:id", ...admin, updateMovie);
r.delete("/movies/:id", ...admin, deleteMovie);

// theatres
r.get("/theatres", listTheatres);
r.get("/theatres/:id", getTheatre);
r.post("/theatres", ...admin, createTheatre);
r.put("/theatres/:id", ...admin, updateTheatre);
r.delete("/theatres/:id", ...admin, deleteTheatre);

// screens
r.get("/screens", listScreens);
r.post("/screens", ...admin, createScreen);
r.put("/screens/:id", ...admin, updateScreen);
r.delete("/screens/:id", ...admin, deleteScreen);

// seats (admin management; users read seats via /shows/:id/seats)
r.get("/seats", ...admin, listSeats);
r.post("/seats", ...admin, createSeat);
r.put("/seats/:id", ...admin, updateSeat);
r.delete("/seats/:id", ...admin, deleteSeat);

// shows + time slots
r.get("/time-slots", listSlots);
r.get("/shows", listShows);
r.get("/shows/:id/seats", showSeats);
r.post("/shows", ...admin, createShow);
r.put("/shows/:id", ...admin, updateShow);
r.delete("/shows/:id", ...admin, deleteShow);

// bookings, payments, e-pass
r.post("/bookings", requireAuth, createBooking);
r.get("/bookings/mine", requireAuth, myBookings);
r.post("/bookings/:id/pay", requireAuth, payBooking);
r.get("/payments/mine", requireAuth, myPayments);
r.get("/payments", ...admin, allPayments);
r.get("/epass/:id", requireAuth, getEPass); // :id = booking_id

// coupons
r.post("/coupons/validate", requireAuth, validateCoupon);
r.get("/coupons", ...admin, listCoupons);
r.post("/coupons", ...admin, createCoupon);
r.put("/coupons/:id", ...admin, updateCoupon);
r.delete("/coupons/:id", ...admin, deleteCoupon);

// discounts
r.get("/discounts/show/:id", showDiscounts); // public: active offers of a show
r.get("/discounts", ...admin, listDiscounts);
r.post("/discounts", ...admin, createDiscount);
r.put("/discounts/:id", ...admin, updateDiscount);
r.delete("/discounts/:id", ...admin, deleteDiscount);

// reviews (/eligible must stay above anything with :id)
r.get("/reviews/eligible", requireAuth, eligibleReviews);
r.get("/reviews", listReviews);
r.post("/reviews", requireAuth, createReview);

// admin dashboard
r.get("/admin/stats", ...admin, stats);
r.get("/admin/users", ...admin, listUsers);
r.get("/admin/bookings", ...admin, listAllBookings);

export default r;