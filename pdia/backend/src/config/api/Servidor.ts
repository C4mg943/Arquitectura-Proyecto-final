import Express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import pool from "../connection/dbConnetions";
import { initSchema } from "../connection/initSchema";
import authRouter from "../../app/finca/route/AuthRoutes";
import parcelaRouter from "../../app/finca/route/ParcelaRoutes";
import cultivoRouter from "../../app/finca/route/CultivoRoutes";
import actividadRouter from "../../app/finca/route/ActividadRoutes";
import alertaRouter from "../../app/finca/route/AlertaRoutes";
import reporteRouter from "../../app/finca/route/ReporteRoutes";
import fincaRouter from "../../app/finca/route/FincaRoutes";
import operarioRouter from "../../app/finca/route/OperarioRoutes";
import { ErrorHandler } from "../../middleware/ErrorHandler";

class Servidor
{
    public app:Express.Application;
    constructor() {
        this.app= Express();
        this.app.set("PORT", Number(process.env.PORT) || 3123);
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan("dev"));
        this.app.use(Express.json({limit:"100mb"}));
        this.app.use(Express.urlencoded({extended:true}));

        this.app.get("/", (_req, res) => {
            res.status(200).json({ success: true, message: "Servidor iniciado" });
        });

        this.app.use("/api/auth", authRouter);
        this.app.use("/api/parcelas", parcelaRouter);
        this.app.use("/api/cultivos", cultivoRouter);
        this.app.use("/api/actividades", actividadRouter);
        this.app.use("/api/alertas", alertaRouter);
        this.app.use("/api/reportes", reporteRouter);
        this.app.use("/api/fincas", fincaRouter);
        this.app.use("/api/operarios", operarioRouter);
        this.app.use(ErrorHandler);

    }

    public Iniciar():void
    {
        this.app.listen(this.app.get("PORT"), ()=>{
            console.log("Listo el backend en el puerto", this.app.get("PORT"))
        });
        pool.connect()
            .then((obj) => {
                console.log(`✅ Base de Datos: Conectada a "${obj.client.database}"`);
                obj.done();
                return initSchema();
            })
            .then(() => {
                console.log("✅ Esquema base inicializado");
            })
            .catch((error) => {
                console.error("❌ Error de Base de Datos:", error.message || error);
                console.log("⚠️  Revisa si tu contenedor Docker está encendido.");
            });
    }
}
export default Servidor;
