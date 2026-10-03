import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const show = (v) => (v === null || v === undefined ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v));

/**
 * endpoint : base REST path, e.g. "/movies"
 * listPath : optional different GET path (e.g. "/shows?includePast=1")
 * idKey    : primary key name of a row
 * columns  : [{ key, label }]
 * fields   : [{ name, label, type: text|number|date|select|checkbox, options, createOnly, hint }]
 * onChange : called after create/update/delete (lets a page refresh dropdowns)
 */
export default function CrudManager({ title, endpoint, listPath, idKey, columns, fields, onChange }) {
    const blank = () => Object.fromEntries(fields.map((f) => [f.name, f.type === "checkbox" ? true : ""]));
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(blank());
    const [editId, setEditId] = useState(null);
    const [err, setErr] = useState("");

    const load = () => api(listPath || endpoint).then(setRows).catch((e) => setErr(e.message));
    useEffect(() => { load(); }, []);

    const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
    const reset = () => { setForm(blank()); setEditId(null); };

    function edit(row) {
        const f = {};
        fields.forEach((fl) => {
            let v = row[fl.name];
            if (v === null || v === undefined) v = fl.type === "checkbox" ? false : "";
            if (fl.type === "date" && typeof v === "string") v = v.slice(0, 10);
            f[fl.name] = v;
        });
        setForm(f); setEditId(row[idKey]); setErr("");
    }

    async function save() {
        try {
            const body = {};
            fields.forEach((fl) => {
                if (editId && fl.createOnly) return;
                const v = form[fl.name];
                body[fl.name] = fl.type === "number" ? (v === "" ? null : Number(v)) : v === "" ? null : v;
            });
            await api(editId ? `${endpoint}/${editId}` : endpoint, { method: editId ? "PUT" : "POST", body });
            reset(); setErr(""); await load(); onChange?.();
        } catch (e) { setErr(e.message); }
    }

    async function remove(row) {
        if (!confirm("Delete this record?")) return;
        try {
            await api(`${endpoint}/${row[idKey]}`, { method: "DELETE" });
            setErr(""); await load(); onChange?.();
        } catch (e) { setErr(e.message); }
    }

    return (
        <section className="card">
            <h3>{title}</h3>
            <div className="form-grid">
                {fields.filter((f) => !(editId && f.createOnly)).map((f) => (
                    <label key={f.name}>
                        <span>{f.label}</span>
                        {f.type === "select" ? (
                            <select value={form[f.name]}
                                onChange={(e) => set(f.name, (f.options.find((o) => String(o.value) === e.target.value) || { value: "" }).value)}>
                                <option value="">— select —</option>
                                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        ) : f.type === "checkbox" ? (
                            <input type="checkbox" checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                        ) : (
                            <input type={f.type || "text"} value={form[f.name]} placeholder={f.hint || ""}
                                onChange={(e) => set(f.name, e.target.value)} />
                        )}
                    </label>
                ))}
            </div>
            <div className="row-left">
                <button onClick={save}>{editId ? "Update" : "Add"}</button>
                {editId && <button className="ghost" onClick={reset}>Cancel edit</button>}
            </div>
            {err && <p className="error">{err}</p>}
            <div className="table-wrap">
                <table>
                    <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row[idKey]}>
                                {columns.map((c) => <td key={c.key}>{show(row[c.key])}</td>)}
                                <td className="actions">
                                    <button className="small" onClick={() => edit(row)}>Edit</button>
                                    <button className="small danger" onClick={() => remove(row)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={columns.length + 1}>No records yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}