import pool from "../config/db.js";
import { clean, missing } from "../utils/clean.js";

// GET /api/reviews?movieId=&theatreId=   (public; email is NOT exposed)
export async function listReviews(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT r.review_id, r.rating, r.review_text, r.review_date, u.name, m.movie_name, t.theatre_name
       FROM reviews r JOIN users u ON u.email=r.user_email
       JOIN movies m ON m.movie_id=r.movie_id
       JOIN theatres t ON t.theatre_id=r.theatre_id
       WHERE ($1::int IS NULL OR r.movie_id=$1) AND ($2::int IS NULL OR r.theatre_id=$2)
       ORDER BY r.review_date DESC`,
            [req.query.movieId || null, req.query.theatreId || null]);
        res.json(rows);
    } catch (e) { next(e); }
}

// GET /api/reviews/eligible  -> (movie, theatre) pairs this user has a CONFIRMED booking for
export async function eligibleReviews(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT DISTINCT m.movie_id, m.movie_name, t.theatre_id, t.theatre_name
       FROM bookings b
       JOIN shows sh ON sh.show_id=b.show_id
       JOIN movies m ON m.movie_id=sh.movie_id
       JOIN screens sc ON sc.screen_id=sh.screen_id
       JOIN theatres t ON t.theatre_id=sc.theatre_id
       WHERE b.user_email=$1 AND b.booking_status='CONFIRMED'`,
            [req.user.email]);
        res.json(rows);
    } catch (e) { next(e); }
}

// POST /api/reviews { movie_id, theatre_id, rating, review_text }
// One review per (user, movie, theatre): posting again UPDATES it (UPSERT).
export async function createReview(req, res, next) {
    try {
        const { movie_id, theatre_id, rating, review_text } = req.body;
        if (missing(movie_id, theatre_id, rating))
            return res.status(400).json({ message: "Movie, theatre and rating are required" });
        if (!Number.isInteger(Number(rating)) || rating < 1 || rating > 5)
            return res.status(400).json({ message: "Rating must be between 1 and 5" });

        const booked = await pool.query(
            `SELECT 1 FROM bookings b
       JOIN shows sh ON sh.show_id=b.show_id
       JOIN screens sc ON sc.screen_id=sh.screen_id
       WHERE b.user_email=$1 AND b.booking_status='CONFIRMED'
         AND sh.movie_id=$2 AND sc.theatre_id=$3 LIMIT 1`,
            [req.user.email, movie_id, theatre_id]);
        if (!booked.rows[0])
            return res.status(403).json({ message: "You can review only movies you booked at that theatre" });

        const { rows } = await pool.query(
            `INSERT INTO reviews (user_email, movie_id, theatre_id, rating, review_text)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_email, movie_id, theatre_id)
       DO UPDATE SET rating=EXCLUDED.rating, review_text=EXCLUDED.review_text, review_date=NOW()
       RETURNING *`,
            [req.user.email, movie_id, theatre_id, rating, clean(review_text)]);
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
}