import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users, movies } from '../drizzle/schema'

const sqlite = new Database('./drizzle/db.sqlite');
const db = drizzle(sqlite);
const userCnt = 2000;
const normalUserThd = 0.9;
const exploresDescThd = 0.5
export const rankCnt = 100;
const movieCnt = rankCnt;

export const newMovie = () => {
    const cQuality = Math.random();
    // 半分はcQualityと比例、残りの半分はランダム
    const risk = cQuality * 0.5 + Math.random() * 0.5;
    return {
        c_quality: cQuality,
        popularity: 0,
        risk: risk
    };
}

for(let i=0; i<userCnt; i++){
    let startRank = 1;
    let exploresDesc = true;
    if(normalUserThd < Math.random()){
        startRank = Math.ceil(Math.random() * rankCnt);
        exploresDesc = Math.random() >= exploresDescThd;
    }
    await db.insert(users).values({
        // 離脱率としても使うので、大体の人は2本くらいDLしたら抜けるようにしておく
        frequency: Math.random() * 0.5 + 0.5,
        start_rank : startRank,
        explores_desc: exploresDesc,
    });
}

for(let i=0; i<movieCnt; i++){
    const movie = newMovie();
    await db.insert(movies).values(movie);
}