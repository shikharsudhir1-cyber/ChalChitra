import pool from "../config/db.js";
import { clean } from "../utils/clean.js";

export async function listMovies(req, res, next) {
    try {
        // LEFT JOIN + GROUP BY: average rating per movie
        const { rows } = await pool.query(
            `SELECT m.*, ROUND(AVG(r.rating),1) AS avg_rating, COUNT(r.review_id) AS review_count
       FROM movies m LEFT JOIN reviews r ON r.movie_id = m.movie_id
       GROUP BY m.movie_id ORDER BY m.release_date DESC NULLS LAST`
        );
        res.json(rows);
    } catch (e) { next(e); }
}

export async function getMovie(req, res, next) {
    try {
        const { rows } = await pool.query("SELECT * FROM movies WHERE movie_id=$1", [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Movie not found" });
        const reviews = await pool.query(
            `SELECT r.rating, r.review_text, r.review_date, u.name, t.theatre_name
       FROM reviews r JOIN users u ON u.email=r.user_email
       JOIN theatres t ON t.theatre_id=r.theatre_id
       WHERE r.movie_id=$1 ORDER BY r.review_date DESC`, [req.params.id]);
        res.json({ ...rows[0], reviews: reviews.rows });
    } catch (e) { next(e); }
}

export async function createMovie(req, res, next) {
    try {
        const { movie_name, duration_min, language, genre, release_date } = req.body;
        if (!movie_name) return res.status(400).json({ message: "Movie name is required" });
        const { rows } = await pool.query(
            `INSERT INTO movies (movie_name, duration_min, language, genre, release_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [movie_name, clean(duration_min), clean(language), clean(genre), clean(release_date)]
        );
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
}

export async function updateMovie(req, res, next) {
    try {
        const { movie_name, duration_min, language, genre, release_date } = req.body;
        if (!movie_name) return res.status(400).json({ message: "Movie name is required" });
        const { rows } = await pool.query(
            `UPDATE movies SET movie_name=$1, duration_min=$2, language=$3, genre=$4, release_date=$5
       WHERE movie_id=$6 RETURNING *`,
            [movie_name, clean(duration_min), clean(language), clean(genre), clean(release_date), req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ message: "Movie not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteMovie(req, res, next) {
    try {
        const r = await pool.query("DELETE FROM movies WHERE movie_id=$1", [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Movie not found" });
        res.json({ message: "Movie deleted" });
    } catch (e) { next(e); }
}