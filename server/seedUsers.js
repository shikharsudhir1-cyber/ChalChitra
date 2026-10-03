import bcrypt from "bcrypt";
import pool from "./src/config/db.js";

// DEVELOPMENT CREDENTIALS ONLY - never use these in a real deployment
const users = [
    ["admin@chalchitra.com", "Admin@123", "Admin", 30, "ADMIN"],
    ["user@chalchitra.com", "User@123", "Test User", 21, "USER"],
];

for (const [email, password, name, age, role] of users) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
        `INSERT INTO users (email, password_hash, name, age, role) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role`,
        [email, hash, name, age, role]);
}

// A sample review so rating averages show up
await pool.query(
    `INSERT INTO reviews (user_email, movie_id, theatre_id, rating, review_text)
   VALUES ('user@chalchitra.com', 1, 1, 5, 'Mind-bending and beautifully shot!')
   ON CONFLICT DO NOTHING`);

console.log("Seeded: admin@chalchitra.com / Admin@123 and user@chalchitra.com / User@123");
await pool.end();