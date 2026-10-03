import pool from "../config/db.js";
import { missing } from "../utils/clean.js";

// GET /api/shows?movieId=1&includePast=1
export async function listShows(req, res, next) {
    try {
        const { movieId, includePast } = req.query;
        const { rows } = await pool.query(
            `SELECT sh.show_id, sh.movie_id, sh.screen_id, sh.slot_id, sh.show_date, sh.base_price,
              m.movie_name, t.theatre_name, t.location, sc.screen_name, ts.slot_label, ts.start_time
       FROM shows sh
       JOIN movies m ON m.movie_id=sh.movie_id
       JOIN screens sc ON sc.screen_id=sh.screen_id
       JOIN theatres t ON t.theatre_id=sc.theatre_id
       JOIN time_slots ts ON ts.slot_id=sh.slot_id
       WHERE ($2::boolean OR sh.show_date >= CURRENT_DATE)
         AND ($1::int IS NULL OR sh.movie_id=$1)
       ORDER BY sh.show_date, ts.start_time`,
            [movieId || null, includePast === "1"]
        );
        res.json(rows);
    } catch (e) { next(e); }
}

// Seats of a show with availability. A seat is taken if it belongs to a
// CONFIRMED booking, or a PENDING one created in the last 10 minutes.
export async function showSeats(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT s.seat_id, s.seat_number, s.seat_location, s.is_offline_reserved,
        (s.is_offline_reserved OR EXISTS (
           SELECT 1 FROM booking_seats bs JOIN bookings b ON b.booking_id=bs.booking_id
           WHERE bs.seat_id=s.seat_id AND b.show_id=$1
             AND (b.booking_status='CONFIRMED'
               OR (b.booking_status='PENDING' AND b.booking_time > NOW() - INTERVAL '10 minutes'))
        )) AS is_taken
       FROM seats s JOIN shows sh ON sh.screen_id=s.screen_id
       WHERE sh.show_id=$1 ORDER BY s.seat_number`,
            [req.params.id]
        );
        res.json(rows);
    } catch (e) { next(e); }
}

export async function listSlots(req, res, next) {
    try {
        res.json((await pool.query("SELECT * FROM time_slots ORDER BY start_time")).rows);
    } catch (e) { next(e); }
}

export async function createShow(req, res, next) {
    try {
        const { movie_id, screen_id, slot_id, show_date, base_price } = req.body;
        if (missing(movie_id, screen_id, slot_id, show_date, base_price))
            return res.status(400).json({ message: "Movie, screen, slot, date and price are required" });
        const { rows } = await pool.query(
            `INSERT INTO shows (movie_id, screen_id, slot_id, show_date, base_price)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [movie_id, screen_id, slot_id, show_date, base_price]
        );
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
}

export async function updateShow(req, res, next) {
    try {
        const { movie_id, screen_id, slot_id, show_date, base_price } = req.body;
        if (missing(movie_id, screen_id, slot_id, show_date, base_price))
            return res.status(400).json({ message: "Movie, screen, slot, date and price are required" });
        const { rows } = await pool.query(
            `UPDATE shows SET movie_id=$1, screen_id=$2, slot_id=$3, show_date=$4, base_price=$5
       WHERE show_id=$6 RETURNING *`,
            [movie_id, screen_id, slot_id, show_date, base_price, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: "Show not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteShow(req, res, next) {
    try {
        const r = await pool.query("DELETE FROM shows WHERE show_id=$1", [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Show not found" });
        res.json({ message: "Show deleted" });
    } catch (e) { next(e); }
}