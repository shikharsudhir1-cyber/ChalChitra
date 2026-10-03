import pool from "../config/db.js";
import { missing } from "../utils/clean.js";

// Keeps screens.total_seats equal to the real number of seat rows
const SYNC_TOTAL = `
  UPDATE screens SET total_seats = (SELECT COUNT(*) FROM seats WHERE screen_id=$1)
  WHERE screen_id=$1`;

export async function listSeats(req, res, next) {
    try {
        if (!req.query.screenId) return res.status(400).json({ message: "screenId is required" });
        const { rows } = await pool.query(
            "SELECT * FROM seats WHERE screen_id=$1 ORDER BY LEFT(seat_number,1), LENGTH(seat_number), seat_number",
            [req.query.screenId]);
        res.json(rows);
    } catch (e) { next(e); }
}

export async function createSeat(req, res, next) {
    const { screen_id, seat_number, seat_location } = req.body;
    if (missing(screen_id, seat_number))
        return res.status(400).json({ message: "Screen and seat number are required" });
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const seat = (await client.query(
            `INSERT INTO seats (screen_id, seat_number, seat_location) VALUES ($1,$2,$3) RETURNING *`,
            [screen_id, seat_number.toUpperCase(), seat_location || "REGULAR"])).rows[0];
        await client.query(SYNC_TOTAL, [screen_id]);
        await client.query("COMMIT");
        res.status(201).json(seat);
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
}

// Used to mark a seat offline-reserved (counter sale) or change its category
export async function updateSeat(req, res, next) {
    try {
        const { seat_location, is_offline_reserved } = req.body;
        const { rows } = await pool.query(
            `UPDATE seats SET seat_location = COALESCE($1, seat_location),
                        is_offline_reserved = COALESCE($2, is_offline_reserved)
       WHERE seat_id=$3 RETURNING *`,
            [seat_location ?? null, is_offline_reserved ?? null, req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Seat not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteSeat(req, res, next) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const del = await client.query("DELETE FROM seats WHERE seat_id=$1 RETURNING screen_id", [req.params.id]);
        if (!del.rows[0]) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Seat not found" });
        }
        await client.query(SYNC_TOTAL, [del.rows[0].screen_id]);
        await client.query("COMMIT");
        res.json({ message: "Seat deleted" });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
}