import pool from "../config/db.js";
import { clean, missing } from "../utils/clean.js";

async function validate(b) {
    if (missing(b.show_id, b.discount_name, b.discount_type, b.discount_value, b.valid_from, b.valid_until))
        return "Show, name, type, value and validity dates are required";
    if (!["FLAT", "PERCENT"].includes(b.discount_type)) return "Type must be FLAT or PERCENT";
    if (Number(b.discount_value) <= 0) return "Discount value must be positive";
    if (b.discount_type === "PERCENT" && Number(b.discount_value) > 100) return "Percent cannot exceed 100";
    if (clean(b.seat_id) !== null) {
        // EXISTS-style check: the seat must belong to the screen of that show
        const ok = await pool.query(
            `SELECT 1 FROM shows sh JOIN seats s ON s.screen_id=sh.screen_id
       WHERE sh.show_id=$1 AND s.seat_id=$2`, [b.show_id, b.seat_id]);
        if (!ok.rows[0]) return "That seat does not belong to the selected show's screen";
    }
    return null;
}

// Admin list with human-readable show label
export async function listDiscounts(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT d.*, m.movie_name || ' | ' || t.theatre_name || ' | ' || sh.show_date::text AS show_label,
              s.seat_number
       FROM discounts d
       JOIN shows sh ON sh.show_id=d.show_id
       JOIN movies m ON m.movie_id=sh.movie_id
       JOIN screens sc ON sc.screen_id=sh.screen_id
       JOIN theatres t ON t.theatre_id=sc.theatre_id
       LEFT JOIN seats s ON s.seat_id=d.seat_id
       ORDER BY d.discount_id DESC`);
        res.json(rows);
    } catch (e) { next(e); }
}

// Public: currently active offers of one show (shown on the seat page)
export async function showDiscounts(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT d.discount_name, d.discount_type, d.discount_value, s.seat_number
       FROM discounts d LEFT JOIN seats s ON s.seat_id=d.seat_id
       WHERE d.show_id=$1 AND d.is_active AND CURRENT_DATE BETWEEN d.valid_from AND d.valid_until`,
            [req.params.id]);
        res.json(rows);
    } catch (e) { next(e); }
}

export async function createDiscount(req, res, next) {
    try {
        const err = await validate(req.body);
        if (err) return res.status(400).json({ message: err });
        const b = req.body;
        const { rows } = await pool.query(
            `INSERT INTO discounts (show_id, seat_id, discount_name, discount_type, discount_value, valid_from, valid_until, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [b.show_id, clean(b.seat_id), b.discount_name, b.discount_type, b.discount_value,
            b.valid_from, b.valid_until, b.is_active ?? true]);
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
}

export async function updateDiscount(req, res, next) {
    try {
        const err = await validate(req.body);
        if (err) return res.status(400).json({ message: err });
        const b = req.body;
        const { rows } = await pool.query(
            `UPDATE discounts SET show_id=$1, seat_id=$2, discount_name=$3, discount_type=$4,
              discount_value=$5, valid_from=$6, valid_until=$7, is_active=$8
       WHERE discount_id=$9 RETURNING *`,
            [b.show_id, clean(b.seat_id), b.discount_name, b.discount_type, b.discount_value,
            b.valid_from, b.valid_until, b.is_active ?? true, req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Discount not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteDiscount(req, res, next) {
    try {
        const r = await pool.query("DELETE FROM discounts WHERE discount_id=$1", [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Discount not found" });
        res.json({ message: "Discount deleted" });
    } catch (e) { next(e); }
}