import dotenV from "dotenv";
import pgPromise from "pg-promise";
import { optionsPG } from "./optionsPG";

dotenV.config({path: ".env"});
const portDB = Number(process.env.DB_PORT ?? process.env.PORT_DB ?? 5432);
const datbd = String(process.env.DB_NAME ?? process.env.DATABASE ?? "pdia");
const hostDB = String(process.env.DB_HOST ?? process.env.HOST ?? "localhost");
const Userdb = String(process.env.DB_USER ?? process.env.USER_DB ?? "postgres");
const passDB = String(process.env.DB_PASSWORD ?? process.env.USER_PASSWORD ?? "postgres");

const pgp = pgPromise(optionsPG);
const pool = pgp({
    user: Userdb,
    password: passDB,
    database: datbd,
    host: hostDB,
    port: portDB
});

pool.connect().then((conex) => {
    console.log("Conectado a" + datbd)
    conex.done();
}).catch((error) => {
    console.log(error);
});
export default pool;
