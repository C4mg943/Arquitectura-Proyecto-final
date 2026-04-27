import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import { connectRabbitMQ, subscribeEvents } from "./config/rabbitmq.js";

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

  app.get("/api/notifications", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "No autorizado" });
    const result = await pool.query(
      "SELECT * FROM notificaciones WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.json(result.rows);
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    await pool.query("UPDATE notificaciones SET leida = true WHERE id = $1", [req.params.id]);
    res.json({ message: "Notificación marcada como leída" });
  });

  app.listen(PORT, () => console.log(`🚀 Notification service on port ${PORT}`));
}
start();