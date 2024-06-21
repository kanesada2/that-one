import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { movies, downloads, users } from "../drizzle/schema";
import { and, eq, gte } from "drizzle-orm";

const sqlite = new Database('./drizzle/db.sqlite');
const db = drizzle(sqlite);

const base = 10000; // jsの小数点誤差を避けるために導入している存在　少数以下5桁のみ扱う

const pv = 100000;

const rankCnt = 100;
const rankSpan = 1000;
const deleteThld = 0.1;
const createThld = 0.1;
const userRecords = await db.select().from(users);
let movieRecords = await db.select().from(movies).where(eq(movies.deleted_at, 0));

const lotUser = () => {
    // frequencyが高いユーザーは抽選されやすい
    const frequencies = userRecords.map(userRecord => userRecord.frequency);
    const frequencySum = frequencies.reduce((aggregated, current)=>{
        return  aggregated + Math.ceil(current * base);
    });
    let lot = Math.floor(Math.random() * frequencySum);
    let user = userRecords[0];
    for(const userRecord of userRecords){
        lot -= Math.ceil(userRecord.frequency * base);
        if(lot <= 0){
            user = userRecord;
            break;
        }
    }
    return user;
}
let ranking: {
    id: number,
    c_quality: number,
    risk: number,
    download: number,
    popularity: number,
    deleted_at: number
}[] = movieRecords;

for(let i=1; i<=pv; i++){
    ranking = ranking.sort((record1, record2)=>{
        return record1.popularity > record2.popularity ? -1 : 1; 
    });
    const user = lotUser();
    let checkCnt = 0;
    const downloadOrNot = async () => {
        const rank = user.start_rank + checkCnt;
        if(!(1 <= rank && rank <= rankCnt)){
            // 1位から最下位の範囲を出てしまったら抜ける
            return;
        }
        const movie = ranking[rank - 1];
        const existMovie = await db.select({id: downloads.id}).from(downloads).where(and(eq(downloads.user_id, user.id), eq(downloads.movie_id, movie.id)));
        if(existMovie.length == 0 && movie.deleted_at == 0 && Math.random() < movie.c_quality) {
            // cQualityが高い動画はダウンロードされやすい
            await db.insert(downloads).values({
                user_id: user.id,
                movie_id: movie.id,
                created_at: i
            });
            movie.download++;
                // popularityはrealだから気持ち悪いので
            movie.popularity += 1;
            if(Math.random() < user.frequency){
                // frequencyが高いユーザーは離脱しやすい
                return;
            }
        }
        // 離脱しなかったなら次に見る動画にインデックスを合わせる
        if(user.explores_desc){
            checkCnt++;
        }else{
            checkCnt--;
        }
        await downloadOrNot();
    }
    await downloadOrNot();

    const risks = ranking.map(rank=>{
        // 削除済みの動画は合算しない 
        return rank.deleted_at > 0 ? rank.risk : 0;
    });
    let riskSum = risks.reduce((a,b) => a + Math.ceil(b * base));
    const executesDelete = Math.random() < deleteThld;
    let isDeleted = false;
    // 集計対象範囲の全DL
    const populableDownloads = await db.select({movie_id: downloads.movie_id}).from(downloads).where(gte(downloads.created_at, i - rankSpan));
    ranking = ranking.map((movie)=>{
        // 削除とpopularityの更新を1ループで済ましている
        // 万単位のpvあるとチリツモで遅くなるので
        let deletedAt = movie.deleted_at;
        if(executesDelete && !isDeleted){
            if(movie.deleted_at == 0){
                // 該当動画が未削除なら対象
                riskSum -= Math.ceil(movie.risk * base);
            }
            if(riskSum <= 0){
                // riskが高いほど削除されやすい
                deletedAt = i;
                isDeleted = true;
            }
        }
        // 集計範囲の各動画のDL数を求める
        const populableCnt = populableDownloads.filter(dl => dl.movie_id == movie.id).length;
        let popularity = movie.popularity;
        if(popularity > 0){
            // pvごとに集計対象ダウンロードの効果を減価償却
            popularity = Math.ceil(popularity * rankSpan - 1 * populableCnt) / rankSpan;
            if(popularity < 0){
                popularity = 0;
            }
        }
        return {
            id: movie.id,
            c_quality: movie.c_quality,
            risk: movie.risk,
            download: movie.download,
            popularity: popularity,
            deleted_at: deletedAt
        }
    });

    if(Math.random() < createThld){
        // 最下位
        const lastMovie = ranking[rankCnt - 1];
        const cQuality = Math.random();
        // 半分はcQualityと比例、残りの半分はランダム
        const risk = cQuality * 0.5 + Math.random() * 0.5;
        // 最下位より1pv分人気が高い動画としてランク入りさせる
        const newMovie = await db.insert(movies).values({
            c_quality: cQuality,
            popularity: lastMovie.popularity + 1 / rankSpan,
            risk: risk
        }).returning();
        ranking.push(newMovie[0]);
        // 架空のユーザーによる1ダウンロードも設定しておく
        await db.insert(downloads).values({
            user_id: 0,
            movie_id: newMovie[0].id,
            created_at: i,
        });
    }

}
// update回数を減らすために配列を操作して最後にまとめて反映
ranking.forEach(async(movie) =>{
    await db.update(movies).set(movie).where(eq(movies.id, movie.id));
});

