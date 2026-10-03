import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const sign = (u) =>
    jwt.sign({ email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

export async function register(req, res, next) {
    try {
        const { email, password, name, age } = req.body;
        if (!email || !password || !name || password.length < 6)
            return res.status(400).json({ message: "Email, name and password (min 6 chars) required" });
        const hash = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
            `INSERT INTO users (email, password_hash, name, age)
       VALUES ($1,$2,$3,$4) RETURNING email, name, role`,
            [email.toLowerCase(), hash, name, age || null]
        );
        res.status(201).json({ user: rows[0], token: sign(rows[0]) });
    } catch (e) {
        if (e.code === "23505") return res.status(409).json({ message: "Email already registered" });
        next(e);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const { rows } = await pool.query(
            "SELECT email, name, role, password_hash FROM users WHERE email=$1",
            [(email || "").toLowerCase()]
        );
        const u = rows[0];
        if (!u || !(await bcrypt.compare(password || "", u.password_hash)))
            return res.status(401).json({ message: "Invalid email or password" });
        res.json({ user: { email: u.email, name: u.name, role: u.role }, token: sign(u) });
    } catch (e) { next(e); }
}