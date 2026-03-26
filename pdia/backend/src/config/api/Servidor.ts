import Express from "express";
import cors from "cors";
import morgan from "morgan";
import pool from "../connection/dbConnetions";

;
class Servidor
{
    public app:Express.Application;
    constructor() {
        this.app= Express();
        this.app.set("PORT",3123);
        this.app.use(cors());
        this.app.use(morgan("dev"));
        this.app.use(Express.json({limit:"100mb"}));
        this.app.use(Express.urlencoded({extended:true}));

        this.app.get("/", (req, res) => {
            res.status(200).json({ mensaje: "servidor iniciado" });
        });

    }

    public Iniciar():void
    {
        this.app.listen(this.app.get("PORT"), ()=>{
            console.log("Listo el backend en el puerto", this.app.get("PORT"))
        });
        pool.connect()
            .then((obj) => {
                console.log(`✅ Base de Datos: Conectada a "${obj.client.database}"`);
                obj.done(); // Liberamos la conexión de prueba
            })
            .catch((error) => {
                console.error("❌ Error de Base de Datos:", error.message || error);
                console.log("⚠️  Revisa si tu contenedor Docker está encendido.");
            });
    }
}
export default Servidor;