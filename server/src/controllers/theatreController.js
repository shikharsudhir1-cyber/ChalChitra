import pool from "../config/db.js";
import { missing } from "../utils/clean.js";

export async function listTheatres(req, res, next) {
    try {
        // Two LEFT JOINs + GROUP BY. DISTINCT counts avoid double counting.
        const { rows } = await pool.query(
            `SELECT t.*, COUNT(DISTINCT sc.screen_id) AS screen_count,
              ROUND(AVG(r.rating),1) AS avg_rating, COUNT(DISTINCT r.review_id) AS review_count
       FROM theatres t
       LEFT JOIN screens sc ON sc.theatre_id=t.theatre_id
       LEFT JOIN reviews r ON r.theatre_id=t.theatre_id
       GROUP BY t.theatre_id ORDER BY t.theatre_name`
        );
        res.json(rows);
    } catch (e) { next(e); }
}

export async function getTheatre(req, res, next) {
    try {
        const t = await pool.query("SELECT * FROM theatres WHERE theatre_id=$1", [req.params.id]);
        if (!t.rows[0]) return res.status(404).json({ message: "Theatre not found" });
        const screens = await pool.query(
            "SELECT screen_id, screen_name, total_seats FROM screens WHERE theatre_id=$1 ORDER BY screen_name",
            [req.params.id]);
        const reviews = await pool.query(
            `SELECT r.rating, r.review_text, r.review_date, u.name, m.movie_name
       FROM reviews r JOIN users u ON u.email=r.user_email
       JOIN movies m ON m.movie_id=r.movie_id
       WHERE r.theatre_id=$1 ORDER BY r.review_date DESC`, [req.params.id]);
        const avg = await pool.query(
            "SELECT ROUND(AVG(rating),1) AS avg_rating FROM reviews WHERE theatre_id=$1", [req.params.id]);
        res.json({ ...t.rows[0], avg_rating: avg.rows[0].avg_rating, screens: screens.rows, reviews: reviews.rows });
    } catch (e) { next(e); }
}

export async function createTheatre(req, res, next) {
    try {
        const { theatre_name, location } = req.body;
        if (missing(theatre_name, location))
            return res.status(400).json({ message: "Theatre name and location are required" });
        const { rows } = await pool.query(
            "INSERT INTO theatres (theatre_name, location) VALUES ($1,$2) RETURNING *",
            [theatre_name, location]);
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
}

export async function updateTheatre(req, res, next) {
    try {
        const { theatre_name, location } = req.body;
        if (missing(theatre_name, location))
            return res.status(400).json({ message: "Theatre name and location are required" });
        const { rows } = await pool.query(
            "UPDATE theatres SET theatre_name=$1, location=$2 WHERE theatre_id=$3 RETURNING *",
            [theatre_name, location, req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Theatre not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteTheatre(req, res, next) {
    try {
        const r = await pool.query("DELETE FROM theatres WHERE theatre_id=$1", [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Theatre not found" });
        res.json({ message: "Theatre deleted" });
    } catch (e) { next(e); }
}