import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { pool, connectDb } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

interface ActividadRow {
  id: number;
  tipo: string;
  fecha: Date;
  descripcion: string;
  datos?: object;
}

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "report-service" });
});

app.get("/api/reports/activities/:cultivoId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT tipo, COUNT(*) as total FROM actividades WHERE cultivo_id = $1 GROUP BY tipo`,
      [req.params.cultivoId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching activities" });
  }
});

app.get("/api/reports/riegos/:cultivoId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT fecha, datos->>'cantidad' as cantidad FROM actividades WHERE cultivo_id = $1 AND tipo = 'RIEGO' ORDER BY fecha DESC`,
      [req.params.cultivoId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching riegos" });
  }
});

app.get("/api/reports/fertilizaciones/:cultivoId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT fecha, datos->>'tipo' as tipo FROM actividades WHERE cultivo_id = $1 AND tipo = 'FERTILIZACION' ORDER BY fecha DESC`,
      [req.params.cultivoId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching fertilizaciones" });
  }
});

app.get("/api/reports/export/csv/:cultivoId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, tipo, fecha, descripcion FROM actividades WHERE cultivo_id = $1 ORDER BY fecha DESC`,
      [req.params.cultivoId]
    );
    const rows = result.rows as ActividadRow[];
    const csv = "id,tipo,fecha,descripcion\n" + rows.map((r: ActividadRow) => `${r.id},${r.tipo},${r.fecha},"${r.descripcion}"`).join("\n");
    res.header("Content-Type", "text/csv").send(csv);
  } catch (error) {
    res.status(500).json({ error: "Error exporting CSV" });
  }
});

async function start() {
  await connectDb();
  app.listen(PORT, () => console.log(`🚀 Report service on port ${PORT}`));
}

start();