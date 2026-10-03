import pg from "pg";
import "dotenv/config";

console.log("DB_USER =", process.env.DB_USER);
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_NAME =", process.env.DB_NAME);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD);
console.log("DB_PORT =", process.env.DB_PORT);

// Without this, node-postgres builds a JS Date and JSON turns it into UTC,
// which can shift the date by one day in IST.
pg.types.setTypeParser(1082, (value) => value);

// One shared pool. pool.query() for single statements,
// pool.connect() when a transaction needs ONE dedicated connection.
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export default pool;