import "dotenv/config";
import express from "express";
import cors from "cors";
import { recommendationRouter } from "./routes/recommendation.routes.js";
import { connectDb } from "./config/db.js";
import { connectRabbitMQ, subscribeEvents } from "./config/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());
app.use("/api/recomendaciones", recommendationRouter);
app.get("/health", (req, res) => res.json({ status: "ok", service: "recommendation-service" }));

async function start() {
  await connectDb();
  await connectRabbitMQ();
  await subscribeEvents();
  app.listen(PORT, () => console.log(`🚀 Recommendation service on port ${PORT}`));
}

start();