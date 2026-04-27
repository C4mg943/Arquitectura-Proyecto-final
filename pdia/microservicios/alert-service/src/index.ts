import "dotenv/config";
import express from "express";
import cors from "cors";
import { alertRouter } from "./routes/alert.routes.js";
import { connectDb } from "./config/db.js";
import { connectRabbitMQ, subscribeToWeather } from "./config/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.use("/api/alertas", alertRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "alert-service" });
});

async function start() {
  try {
    await connectDb();
    console.log("✅ Database connected");

    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected");

    await subscribeToWeather();
    console.log("📥 Subscribed to weather events");

    app.listen(PORT, () => {
      console.log(`🚀 Alert service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

start();