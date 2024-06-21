import { sqliteTable, integer, text, index, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id", {mode: "number"}, ).primaryKey(),
    frequency: real("frequency").notNull(),
    start_rank: integer("start_rank", {mode: "number"}).notNull(),
    explores_desc: integer("explores_desc", {mode: "boolean"}).notNull(),
    total_download : integer("total_download", {mode: "number"}).notNull().default(0),
    total_c_quality : real("total_c_qualtiy").notNull().default(0),
}, (table) => ({
    startRankIdx : index("start_rank_index").on(table.start_rank),
}));

export const movies = sqliteTable("movies", {
    id: integer("id", {mode: "number"}, ).primaryKey(),
    c_quality: real("c_quality").notNull(),
    risk: real("risk").notNull(),
    download: integer("download", {mode: "number"}).notNull().default(0),
    popularity: real("popularity").notNull().default(0),
    deleted_at: integer("deleted_at", {mode: "number"}).notNull().default(0),
});

export const downloads = sqliteTable("downloads", {
    id: integer("id", {mode: "number"}, ).primaryKey(),
    user_id: integer("user_id", {mode: "number"}, ).notNull(),
    movie_id: integer("movie_id", {mode: "number"}, ).notNull(),
    created_at: integer("created_at", {mode:"number"}).notNull().default(0)
}, (table) => ({
    userMovieUnq : uniqueIndex('user_movie_unq').on(table.user_id, table.movie_id),
    createdAtIdx: index("created_at_idx").on(table.created_at),
}))