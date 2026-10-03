import CrudManager from "../components/CrudManager.jsx";

export default function ManageMovies() {
    return (
        <CrudManager title="Manage Movies" endpoint="/movies" idKey="movie_id"
            columns={[
                { key: "movie_id", label: "ID" }, { key: "movie_name", label: "Name" },
                { key: "genre", label: "Genre" }, { key: "language", label: "Language" },
                { key: "duration_min", label: "Min" }, { key: "release_date", label: "Release" },
            ]}
            fields={[
                { name: "movie_name", label: "Movie name" },
                { name: "duration_min", label: "Duration (min)", type: "number" },
                { name: "language", label: "Language" },
                { name: "genre", label: "Genre" },
                { name: "release_date", label: "Release date", type: "date" },
            ]} />
    );
}