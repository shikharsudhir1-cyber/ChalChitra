import pool from "../config/db.js";

export async function stats(req, res, next) {
    try {
        const [counts, top] = await Promise.all([
            pool.query(
                `SELECT (SELECT COUNT(*) FROM users) AS users,
                (SELECT COUNT(*) FROM movies) AS movies,
                (SELECT COUNT(*) FROM theatres) AS theatres,
                (SELECT COUNT(*) FROM shows WHERE show_date >= CURRENT_DATE) AS upcoming_shows,
                (SELECT COUNT(*) FROM bookings WHERE booking_status='CONFIRMED') AS confirmed_bookings,
                (SELECT COALESCE(SUM(amount),0) FROM payments WHERE payment_status='SUCCESS') AS revenue`),
            // JOIN chain + GROUP BY + ORDER BY + LIMIT: revenue per movie
            pool.query(
                `SELECT m.movie_name, COUNT(DISTINCT b.booking_id) AS bookings, SUM(p.amount) AS revenue
         FROM payments p
         JOIN bookings b ON b.booking_id=p.booking_id
         JOIN shows sh ON sh.show_id=b.show_id
         JOIN movies m ON m.movie_id=sh.movie_id
         WHERE p.payment_status='SUCCESS'
         GROUP BY m.movie_id ORDER BY revenue DESC LIMIT 5`),
        ]);
        res.json({ ...counts.rows[0], top_movies: top.rows });
    } catch (e) { next(e); }
}

export async function listUsers(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT u.email, u.name, u.age, u.role, u.created_at, COUNT(b.booking_id) AS bookings
       FROM users u LEFT JOIN bookings b ON b.user_email=u.email
       GROUP BY u.email ORDER BY u.created_at DESC`); // password_hash is never selected
        res.json(rows);
    } catch (e) { next(e); }
}

export async function listAllBookings(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT b.booking_id, b.user_email, b.booking_status, b.total_amount, b.booking_time,
              m.movie_name, t.theatre_name, sh.show_date
       FROM bookings b
       JOIN shows sh ON sh.show_id=b.show_id
       JOIN movies m ON m.movie_id=sh.movie_id
       JOIN screens sc ON sc.screen_id=sh.screen_id
       JOIN theatres t ON t.theatre_id=sc.theatre_id
       ORDER BY b.booking_time DESC LIMIT 100`);
        res.json(rows);
    } catch (e) { next(e); }
}