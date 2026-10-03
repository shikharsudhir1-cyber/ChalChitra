import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api", routes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// PostgreSQL error code -> [HTTP status, friendly message]
const PG_ERRORS = {
    "23505": [409, "That record already exists (duplicate value)"],
    "23503": [409, "Invalid reference, or this record is still used by other data"],
    "23514": [400, "A value breaks a database rule (check constraint)"],
    "23502": [400, "A required field is missing"],
    "22P02": [400, "A value has the wrong format"],
    "22007": [400, "Invalid date or time"],
    "22008": [400, "Invalid date or time"],
};

// Central error handler: ordinary errors never crash the server
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed")
        return res.status(400).json({ message: "Malformed JSON body" });
    if (PG_ERRORS[err.code]) {
        const [status, message] = PG_ERRORS[err.code];
        return res.status(status).json({ message });
    }
    console.error(err);
    res.status(500).json({ message: "Something went wrong on the server" });
});

export default app;