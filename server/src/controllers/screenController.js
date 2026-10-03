import pool from "../config/db.js";
import { missing } from "../utils/clean.js";

// Generates rows A, B, C... x seats 1..N in ONE set-based INSERT ... SELECT.
// The last two rows are PREMIUM, the rest REGULAR.
const GENERATE_SEATS = `
  INSERT INTO seats (screen_id, seat_number, seat_location)
  SELECT $1::int, chr(64 + r) || n,
         CASE WHEN r > $2::int - 2 THEN 'PREMIUM' ELSE 'REGULAR' END
  FROM generate_series(1, $2::int) r, generate_series(1, $3::int) n`;

export async function listScreens(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT sc.*, t.theatre_name FROM screens sc
       JOIN theatres t ON t.theatre_id=sc.theatre_id
       WHERE ($1::int IS NULL OR sc.theatre_id=$1)
       ORDER BY t.theatre_name, sc.screen_name`,
            [req.query.theatreId || null]);
        res.json(rows);
    } catch (e) { next(e); }
}

/**
 * POST /api/screens { theatre_id, screen_name, rows, seats_per_row }
 * Screen + all its seats are created in ONE transaction: either both exist or neither.
 */
export async function createScreen(req, res, next) {
    const { theatre_id, screen_name } = req.body;
    const rowCount = Number(req.body.rows);
    const perRow = Number(req.body.seats_per_row);
    if (missing(theatre_id, screen_name) || !Number.isInteger(rowCount) || !Number.isInteger(perRow)
        || rowCount < 1 || rowCount > 26 || perRow < 1 || perRow > 30)
        return res.status(400).json({ message: "Theatre, name, rows (1-26) and seats per row (1-30) required" });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const screen = (await client.query(
            `INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES ($1,$2,$3) RETURNING *`,
            [theatre_id, screen_name, rowCount * perRow])).rows[0];
        await client.query(GENERATE_SEATS, [screen.screen_id, rowCount, perRow]);
        await client.query("COMMIT");
        res.status(201).json(screen);
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
}

export async function updateScreen(req, res, next) {
    try {
        const { theatre_id, screen_name } = req.body;
        if (missing(theatre_id, screen_name))
            return res.status(400).json({ message: "Theatre and screen name are required" });
        const { rows } = await pool.query(
            "UPDATE screens SET theatre_id=$1, screen_name=$2 WHERE screen_id=$3 RETURNING *",
            [theatre_id, screen_name, req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Screen not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteScreen(req, res, next) {
    try {
        const r = await pool.query("DELETE FROM screens WHERE screen_id=$1", [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Screen not found" });
        res.json({ message: "Screen deleted" });
    } catch (e) { next(e); }
}