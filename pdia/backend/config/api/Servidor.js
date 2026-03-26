"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dbConnetions_1 = __importDefault(require("../connection/dbConnetions"));
;
class Servidor {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.set("PORT", 3123);
        this.app.use((0, cors_1.default)());
        this.app.use((0, morgan_1.default)("dev"));
        this.app.use(express_1.default.json({ limit: "100mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.get("/", (req, res) => {
            res.status(200).json({ mensaje: "servidor iniciado" });
        });
    }
    Iniciar() {
        this.app.listen(this.app.get("PORT"), () => {
            console.log("Listo el backend en el puerto", this.app.get("PORT"));
        });
        dbConnetions_1.default.connect()
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
exports.default = Servidor;
