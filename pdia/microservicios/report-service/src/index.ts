import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { pool, connectDb } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

interface AuthUser {
  userId: number;
  rol: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "pdia-secret-key-change-in-production";
  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: "Rol no autorizado" });
    next();
  };
};

/**
 * Verifica que el usuario tenga acceso al cultivo indicado.
 * - ADMINISTRADOR: acceso total.
 * - PRODUCTOR: cultivo en una finca de su propiedad.
 * - OPERARIO: cultivo en una parcela asignada.
 * - TECNICO: cultivo en una finca de un productor asignado al técnico.
 */
async function userHasAccessToCultivo(user: AuthUser, cultivoId: number): Promise<boolean> {
  if (user.rol === "ADMINISTRADOR") {
    const result = await pool.query("SELECT 1 FROM cultivos WHERE id = $1", [cultivoId]);
    return (result.rowCount ?? 0) > 0;
  }
  if (user.rol === "PRODUCTOR") {
    const result = await pool.query(
      `SELECT 1 FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       WHERE c.id = $1 AND f.propietario_id = $2`,
      [cultivoId, user.userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
  if (user.rol === "OPERARIO") {
    const result = await pool.query(
      `SELECT 1 FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN asignacion_operarios ao ON p.id = ao.parcela_id
       WHERE c.id = $1 AND ao.operario_id = $2`,
      [cultivoId, user.userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
  if (user.rol === "TECNICO") {
    const result = await pool.query(
      `SELECT 1 FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
       WHERE c.id = $1 AND at.tecnico_id = $2`,
      [cultivoId, user.userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
  return false;
}

/** Escapa un valor para CSV (RFC 4180): envuelve en comillas y duplica comillas internas. */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "report-service" });
});

const allowedReportRoles = ["PRODUCTOR", "OPERARIO", "TECNICO", "ADMINISTRADOR"];

app.get(
  "/api/reports/activities/:cultivoId",
  authMiddleware,
  requireRoles(...allowedReportRoles),
  async (req: AuthRequest, res: Response) => {
    try {
      const cultivoId = parseInt(req.params.cultivoId);
      const allowed = await userHasAccessToCultivo(req.user!, cultivoId);
      if (!allowed) return res.status(403).json({ error: "No tienes acceso a este cultivo" });

      const result = await pool.query(
        `SELECT tipo, COUNT(*)::int AS total FROM actividades WHERE cultivo_id = $1 GROUP BY tipo`,
        [cultivoId]
      );

      const porTipo: Record<string, number> = {};
      let total = 0;
      for (const row of result.rows) {
        porTipo[row.tipo] = Number(row.total);
        total += Number(row.total);
      }

      const rangeRes = await pool.query(
        `SELECT MIN(fecha) AS desde, MAX(fecha) AS hasta FROM actividades WHERE cultivo_id = $1`,
        [cultivoId]
      );
      const desde = rangeRes.rows[0]?.desde
        ? new Date(rangeRes.rows[0].desde).toISOString().split("T")[0]
        : null;
      const hasta = rangeRes.rows[0]?.hasta
        ? new Date(rangeRes.rows[0].hasta).toISOString().split("T")[0]
        : null;

      res.json({
        cultivoId,
        totalActividades: total,
        porTipo,
        desde,
        hasta,
      });
    } catch (error) {
      console.error("Error fetching activities report:", error);
      res.status(500).json({ error: "Error fetching activities" });
    }
  }
);

app.get(
  "/api/reports/riegos/:cultivoId",
  authMiddleware,
  requireRoles(...allowedReportRoles),
  async (req: AuthRequest, res: Response) => {
    try {
      const cultivoId = parseInt(req.params.cultivoId);
      const allowed = await userHasAccessToCultivo(req.user!, cultivoId);
      if (!allowed) return res.status(403).json({ error: "No tienes acceso a este cultivo" });

      const result = await pool.query(
        `SELECT id, fecha, descripcion,
                (datos->>'cantidadAgua')::numeric AS cantidad_agua,
                datos->>'observaciones' AS observaciones
         FROM actividades WHERE cultivo_id = $1 AND tipo = 'RIEGO'
         ORDER BY fecha DESC`,
        [cultivoId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching riegos report:", error);
      res.status(500).json({ error: "Error fetching riegos" });
    }
  }
);

app.get(
  "/api/reports/fertilizaciones/:cultivoId",
  authMiddleware,
  requireRoles(...allowedReportRoles),
  async (req: AuthRequest, res: Response) => {
    try {
      const cultivoId = parseInt(req.params.cultivoId);
      const allowed = await userHasAccessToCultivo(req.user!, cultivoId);
      if (!allowed) return res.status(403).json({ error: "No tienes acceso a este cultivo" });

      const result = await pool.query(
        `SELECT id, fecha, descripcion,
                datos->>'tipoFertilizante' AS tipo_fertilizante,
                datos->>'observaciones' AS observaciones
         FROM actividades WHERE cultivo_id = $1 AND tipo = 'FERTILIZACION'
         ORDER BY fecha DESC`,
        [cultivoId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching fertilizaciones report:", error);
      res.status(500).json({ error: "Error fetching fertilizaciones" });
    }
  }
);

async function buildActividadesCsv(cultivoId: number): Promise<string> {
  const result = await pool.query(
    `SELECT id, tipo, fecha, descripcion FROM actividades WHERE cultivo_id = $1 ORDER BY fecha DESC`,
    [cultivoId]
  );
  const header = "id,tipo,fecha,descripcion";
  const rows = result.rows.map((r: any) => {
    const fecha = r.fecha instanceof Date
      ? r.fecha.toISOString().split("T")[0]
      : String(r.fecha).split("T")[0];
    return [r.id, r.tipo, fecha, r.descripcion].map(csvEscape).join(",");
  });
  return [header, ...rows].join("\n");
}

// Endpoint original (se mantiene por compatibilidad)
app.get(
  "/api/reports/export/csv/:cultivoId",
  authMiddleware,
  requireRoles(...allowedReportRoles),
  async (req: AuthRequest, res: Response) => {
    try {
      const cultivoId = parseInt(req.params.cultivoId);
      const allowed = await userHasAccessToCultivo(req.user!, cultivoId);
      if (!allowed) return res.status(403).json({ error: "No tienes acceso a este cultivo" });

      const csv = await buildActividadesCsv(cultivoId);
      res
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="actividades-cultivo-${cultivoId}.csv"`)
        .send(csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Error exporting CSV" });
    }
  }
);

// Endpoint que realmente llama el frontend: /api/reports/activities/:id/csv
app.get(
  "/api/reports/activities/:cultivoId/csv",
  authMiddleware,
  requireRoles(...allowedReportRoles),
  async (req: AuthRequest, res: Response) => {
    try {
      const cultivoId = parseInt(req.params.cultivoId);
      const allowed = await userHasAccessToCultivo(req.user!, cultivoId);
      if (!allowed) return res.status(403).json({ error: "No tienes acceso a este cultivo" });

      const csv = await buildActividadesCsv(cultivoId);
      res
        .header("Content-Type", "text/csv; charset=utf-8")
        .header("Content-Disposition", `attachment; filename="actividades-cultivo-${cultivoId}.csv"`)
        .send(csv);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Error exporting CSV" });
    }
  }
);

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => console.log(`🚀 Report service on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start report-service:", error);
    process.exit(1);
  }
}

start();
