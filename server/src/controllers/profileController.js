import bcrypt from "bcrypt";
import pool from "../config/db.js";

export async function getProfile(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT u.email, u.name, u.age, u.role, u.created_at,
              COUNT(DISTINCT b.booking_id) FILTER (WHERE b.booking_status='CONFIRMED') AS confirmed_bookings,
              COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status='SUCCESS'), 0) AS total_spent
       FROM users u
       LEFT JOIN bookings b ON b.user_email=u.email
       LEFT JOIN payments p ON p.booking_id=b.booking_id
       WHERE u.email=$1 GROUP BY u.email`,
            [req.user.email]);
        if (!rows[0]) return res.status(404).json({ message: "User not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

// PUT /api/profile { name, age, currentPassword?, newPassword? }
export async function updateProfile(req, res, next) {
    try {
        const { name, age, currentPassword, newPassword } = req.body;
        if (!name) return res.status(400).json({ message: "Name is required" });

        if (newPassword) {
            if (newPassword.length < 6)
                return res.status(400).json({ message: "New password must be at least 6 characters" });
            const u = (await pool.query("SELECT password_hash FROM users WHERE email=$1", [req.user.email])).rows[0];
            if (!(await bcrypt.compare(currentPassword || "", u.password_hash)))
                return res.status(401).json({ message: "Current password is incorrect" });
            await pool.query("UPDATE users SET password_hash=$1 WHERE email=$2",
                [await bcrypt.hash(newPassword, 10), req.user.email]);
        }
        const { rows } = await pool.query(
            "UPDATE users SET name=$1, age=$2 WHERE email=$3 RETURNING email, name, age, role",
            [name, age || null, req.user.email]);
        res.json(rows[0]);
    } catch (e) { next(e); }
}