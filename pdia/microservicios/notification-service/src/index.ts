import "dotenv/config";
import express, { Response, NextFunction, Request } from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import { connectRabbitMQ, subscribeEvents } from "./config/rabbitmq.js";
import { authMiddleware, AuthRequest } from "./middleware/auth.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3009;

async function start() {
  await pool.query("SELECT NOW()");
  console.log("✅ PostgreSQL connected");
  await connectRabbitMQ();
  console.log("✅ RabbitMQ connected");
  await subscribeEvents();
  console.log("📥 Subscribed to alert and recommendation events");

  app.get("/health", (req, res) => res.json({ status: "ok", service: "notification-service" }));

  app.get("/api/notifications", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const result = await pool.query(
        "SELECT * FROM notificaciones WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        [userId]
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error listing notifications:", error);
      res.status(500).json({ error: "Error al listar notificaciones" });
    }
  });

  app.put("/api/notifications/:id/read", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const result = await pool.query(
        "UPDATE notificaciones SET leida = true WHERE id = $1 AND user_id = $2 RETURNING id",
        [req.params.id, userId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Notificación no encontrada" });
      }
      res.json({ message: "Notificación marcada como leída" });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Error al marcar la notificación" });
    }
  });

  // Error handler global para no exponer stack traces ni dejar requests colgados
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Error interno del servidor" });
  });

  app.listen(PORT, () => console.log(`🚀 Notification service on port ${PORT}`));
}

start().catch((err) => {
  console.error("❌ Failed to start notification-service:", err);
  process.exit(1);
});
