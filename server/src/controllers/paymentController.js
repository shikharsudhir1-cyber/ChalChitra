import pool from "../config/db.js";

const SELECT_PAYMENTS = `
  SELECT p.payment_id, p.booking_id, p.amount, p.payment_time, p.payment_method,
         p.payment_status, p.transaction_ref, b.user_email, m.movie_name
  FROM payments p
  JOIN bookings b ON b.booking_id=p.booking_id
  JOIN shows sh ON sh.show_id=b.show_id
  JOIN movies m ON m.movie_id=sh.movie_id`;

export async function myPayments(req, res, next) {
    try {
        const { rows } = await pool.query(
            SELECT_PAYMENTS + " WHERE b.user_email=$1 ORDER BY p.payment_time DESC", [req.user.email]);
        res.json(rows);
    } catch (e) { next(e); }
}

export async function allPayments(req, res, next) {
    try {
        const { rows } = await pool.query(SELECT_PAYMENTS + " ORDER BY p.payment_time DESC LIMIT 200");
        res.json(rows);
    } catch (e) { next(e); }
}