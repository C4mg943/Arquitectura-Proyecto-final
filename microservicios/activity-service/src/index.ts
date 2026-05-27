import "dotenv/config";
import express from "express";
import cors from "cors";
import { activityRouter } from "./routes/activity.routes.js";
import { connectDb } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use("/api/actividades", activityRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "activity-service" });
});

async function start() {
  try {
    await connectDb();
    console.log("✅ Database connected");

    await connectRabbitMQ();
    console.log("✅ RabbitMQ connected");

    app.listen(PORT, () => {
      console.log(`🚀 Activity service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

start();