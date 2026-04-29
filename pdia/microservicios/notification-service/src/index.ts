import "dotenv/config";
import express from "express";
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
    const userId = req.user!.userId;
    const result = await pool.query(
      "SELECT * FROM notificaciones WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.json(result.rows);
  });

  app.put("/api/notifications/:id/read", authMiddleware, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    await pool.query("UPDATE notificaciones SET leida = true WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
    res.json({ message: "Notificación marcada como leída" });
  });

  app.listen(PORT, () => console.log(`🚀 Notification service on port ${PORT}`));
}
start();
