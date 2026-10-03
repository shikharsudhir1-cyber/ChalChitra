import crypto from "crypto";
import pool from "../config/db.js";
import * as Q from "../queries/bookingQueries.js";

// Price of one seat after show/seat discounts (all discounts that apply, best one wins)
function seatPrice(base, seatId, discounts) {
    let best = base;
    for (const d of discounts) {
        if (d.seat_id !== null && d.seat_id !== seatId) continue;
        const v = Number(d.discount_value);
        const price = d.discount_type === "FLAT" ? base - v : base - (base * v) / 100;
        best = Math.min(best, Math.max(price, 0));
    }
    return best;
}

/**
 * POST /api/bookings  { showId, seatIds:[], couponCode? }
 * Creates a PENDING booking inside a transaction.
 * Why pool.connect(): BEGIN..COMMIT must run on ONE connection. pool.query()
 * may use a different connection each call, which would break the transaction.
 */
export async function createBooking(req, res, next) {
    const { showId, seatIds, couponCode } = req.body;
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 8)
        return res.status(400).json({ message: "Select 1 to 8 seats" });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Lock the show row -> two users booking the same show are serialized.
        const show = await client.query(Q.LOCK_SHOW, [showId]);
        if (!show.rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Show not found" }); }

        // 2. Seats must belong to this show's screen and not be offline-reserved.
        const valid = await client.query(Q.VALID_SEATS, [showId, seatIds]);
        if (valid.rows.length !== seatIds.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Invalid seat selection" });
        }

        // 3. Re-check availability AFTER taking the lock (this prevents double booking).
        const taken = await client.query(Q.CHECK_TAKEN, [showId, seatIds]);
        if (taken.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "Some seats were just taken. Pick other seats." });
        }

        // 4. Price calculation
        const base = Number(show.rows[0].base_price);
        const discounts = (await client.query(Q.SHOW_DISCOUNTS, [showId])).rows;
        const prices = seatIds.map((id) => ({ id, price: seatPrice(base, id, discounts) }));
        let total = prices.reduce((s, p) => s + p.price, 0);

        let couponId = null;
        if (couponCode) {
            const c = (await client.query(Q.FIND_COUPON, [couponCode.toUpperCase()])).rows[0];
            if (!c) { await client.query("ROLLBACK"); return res.status(400).json({ message: "Invalid or expired coupon" }); }
            const v = Number(c.discount_value);
            total = c.discount_type === "FLAT" ? total - v : total - (total * v) / 100;
            total = Math.max(total, 0);
            couponId = c.coupon_id;
        }

        // 5. Insert pending booking + its seats
        const booking = (await client.query(Q.INSERT_BOOKING,
            [req.user.email, showId, couponId, total.toFixed(2)])).rows[0];
        for (const p of prices)
            await client.query(Q.INSERT_BOOKING_SEAT, [booking.booking_id, p.id, p.price.toFixed(2)]);

        await client.query("COMMIT");
        res.status(201).json({ booking, message: "Seats held for 10 minutes. Complete payment." });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release(); // always return the connection to the pool
    }
}

/**
 * POST /api/bookings/:id/pay  { method }
 * Simulated payment. In ONE transaction: record payment -> confirm booking -> create E-Pass.
 */
export async function payBooking(req, res, next) {
    const { method } = req.body;
    if (!["UPI", "CARD", "NET_BANKING", "CASH"].includes(method))
        return res.status(400).json({ message: "Invalid payment method" });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const b = (await client.query(Q.LOCK_BOOKING, [req.params.id, req.user.email])).rows[0];
        if (!b) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Booking not found" }); }
        if (b.booking_status !== "PENDING") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: `Booking already ${b.booking_status}` });
        }
        // Hold expired? Cancel it so the seats are released.
        const age = (Date.now() - new Date(b.booking_time).getTime()) / 60000;
        if (age > 10) {
            await client.query("UPDATE bookings SET booking_status='CANCELLED' WHERE booking_id=$1", [b.booking_id]);
            await client.query("COMMIT");
            return res.status(410).json({ message: "Seat hold expired. Please book again." });
        }

        const ref = "TXN" + crypto.randomBytes(8).toString("hex").toUpperCase();
        const payment = (await client.query(Q.INSERT_PAYMENT, [b.booking_id, b.total_amount, method, ref])).rows[0];
        await client.query(Q.CONFIRM_BOOKING, [b.booking_id]);
        const qr = `CHALCHITRA|B${b.booking_id}|${crypto.randomUUID()}`;
        const epass = (await client.query(Q.INSERT_EPASS, [b.booking_id, qr])).rows[0];

        await client.query("COMMIT");
        res.json({ message: "Payment successful", payment, epass });
    } catch (e) {
        await client.query("ROLLBACK");
        next(e);
    } finally {
        client.release();
    }
}

export async function myBookings(req, res, next) {
    try { res.json((await pool.query(Q.MY_BOOKINGS, [req.user.email])).rows); }
    catch (e) { next(e); }
}

export async function getEPass(req, res, next) {
    try {
        const { rows } = await pool.query(Q.GET_EPASS, [req.params.id, req.user.email]);
        if (!rows[0]) return res.status(404).json({ message: "E-Pass not found" });
        res.json(rows[0]);
    } catch (e) { next(e); }
}