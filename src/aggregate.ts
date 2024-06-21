import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { downloads, movies, users } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

const sqlite = new Database('./drizzle/db.sqlite');
const base = 10000;
const db = drizzle(sqlite);

const userRecords = await db.select().from(users);

userRecords.forEach(async (userRecord) => {
    const userDownloads = await db.select({movie_id: downloads.movie_id}).from(downloads).where(eq(downloads.user_id, userRecord.id));
    const movieIds = userDownloads.map(userDownload => userDownload.movie_id);
    if(movieIds.length == 0){
        return;
    }
    const userMovies = await db.select({c_quality: movies.c_quality}).from(movies).where(inArray(movies.id, movieIds));
    const cQualitySum = userMovies.map(userMovie => userMovie.c_quality).reduce((a, b) => a + Math.ceil(b * base)) / base;

    userRecord.total_download = movieIds.length;
    userRecord.total_c_quality = cQualitySum;

    await db.update(users).set(userRecord).where(eq(users.id, userRecord.id));
});