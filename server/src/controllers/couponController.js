import pool from "../config/db.js";
import { FIND_COUPON } from "../queries/bookingQueries.js";
import { missing } from "../utils/clean.js";

function validate(b) {
    if (missing(b.coupon_code, b.discount_type, b.discount_value, b.valid_from, b.valid_until))
        return "Code, type, value and validity dates are required";
    if (!["FLAT", "PERCENT"].includes(b.discount_type)) return "Type must be FLAT or PERCENT";
    if (Number(b.discount_value) <= 0) return "Discount value must be positive";
    if (b.discount_type === "PERCENT" && Number(b.discount_value) > 100) return "Percent cannot exceed 100";
    return null;
}

export async function listCoupons(req, res, next) {
    try {
        // Correlated subquery: how many times each coupon has been used
        const { rows } = await pool.query(
            `SELECT c.*, (SELECT COUNT(*) FROM bookings b
                    WHERE b.coupon_id=c.coupon_id AND b.booking_status<>'CANCELLED') AS used_count
       FROM coupons c ORDER BY c.coupon_id DESC`);
        res.json(rows);
    } catch (e) { next(e); }
}

export async function createCoupon(req, res, next) {
    try {
        const err = validate(req.body);
        if (err) return res.status(400).json({ message: err });
        const b = req.body;
        const code = b.coupon_code.toUpperCase();
        const { rows } = await pool.query(
            `INSERT INTO coupons (coupon_code, qr_code, discount_type, discount_value, valid_from, valid_until, usage_limit, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [code, "COUPON-" + code, b.discount_type, b.discount_value, b.valid_from, b.valid_until,
                b.usage_limit ?? 100, b.is_active ?? true]);
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
}

export async function updateCoupon(req, res, next) {
    try {
        const err = validate(req.body);
        if (err) return res.status(400).json({ message: err });
        const b = req.body;
        const code = b.coupon_code.toUpperCase();
        const { rows } = await pool.query(
            `UPDATE coupons SET coupon_code=$1, qr_code=$2, discount_type=$3, discount_value=$4,
              valid_from=$5, valid_until=$6, usage_limit=$7, is_active=$8
       WHERE coupon_id=$9 RETURNING *`,
            [code, "COUPON-" + code, b.discount_type, b.discount_value, b.valid_from, b.valid_until,
                b.usage_limit ?? 100, b.is_active ?? true, req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Coupon not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}

export async function deleteCoupon(req, res, next) {
    try {
        const r = await pool.query("DELETE FROM coupons WHERE coupon_id=$1", [req.params.id]);
        if (r.rowCount === 0) return res.status(404).json({ message: "Coupon not found" });
        res.json({ message: "Coupon deleted" });
    } catch (e) { next(e); } // 23503 if used by bookings -> deactivate instead
}

// POST /api/coupons/validate { couponCode } - preview check before booking
export async function validateCoupon(req, res, next) {
    try {
        const code = (req.body.couponCode || "").toUpperCase();
        const { rows } = await pool.query(FIND_COUPON, [code]);
        if (!rows[0]) return res.status(400).json({ message: "Invalid or expired coupon" });
        const c = rows[0];
        res.json({ coupon_code: c.coupon_code, discount_type: c.discount_type, discount_value: c.discount_value });
    } catch (e) { next(e); }
}