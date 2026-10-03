// "" or undefined -> null, so optional form fields are stored as SQL NULL
export const clean = (v) => (v === "" || v === undefined ? null : v);

// true if any of the given values is empty
export const missing = (...values) =>
    values.some((v) => v === undefined || v === null || v === "");