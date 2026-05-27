import "dotenv/config";
import express from "express";
import cors from "cors";
import { weatherRouter } from "./routes/weather.routes.js";
import { connectDb } from "./config/db.js";
import { connectRabbitMQ, subscribeToEvents } from "./config/rabbitmq.js";
import { startWeatherPoller } from "./jobs/weather.poller.js";
import { WeatherService } from "./services/weather.service.js";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.use("/api/weather", weatherRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "weather-service" });
});

async function start() {
  try {
    await connectDb();
    console.log("✅ Database connected");

    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected");

    // Suscribirse a parcela.created para tener clima disponible sin esperar al poller global.
    const weatherService = new WeatherService();
    await subscribeToEvents(["parcela.created"], async (routingKey, payload) => {
      if (routingKey !== "parcela.created") return;
      const parcelaId = typeof payload.parcelaId === "number" ? payload.parcelaId : null;
      if (!parcelaId) return;
      console.log(`📥 Evento parcela.created recibido para parcela ${parcelaId}`);
      await weatherService.pollParcelaById(parcelaId);
    });

    startWeatherPoller();

    app.listen(PORT, () => {
      console.log(`🚀 Weather service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

start();
