import "dotenv/config";
import express from "express";
import cors from "cors";
import { farmRouter } from "./routes/farm.routes.js";
import { operarioRouter } from "./routes/operario.routes.js";
import { connectDb } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use("/api/fincas", farmRouter);
app.use("/api/parcelas", farmRouter);
app.use("/api/operarios", operarioRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "farm-service" });
});

async function start() {
  try {
    await connectDb();
    console.log("✅ Database connected");

    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected");

    app.listen(PORT, () => {
      console.log(`🚀 Farm service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

start();