import amqp from "amqplib";

let channel: any = null;
let connection: any = null;

export async function connectRabbitMQ(): Promise<void> {
  try {
    const host = process.env.RABBITMQ_HOST || "localhost";
    const port = process.env.RABBITMQ_PORT || "5672";
    connection = await amqp.connect(`amqp://guest:guest@${host}:${port}`);
    channel = await connection.createChannel();
    await channel.assertExchange("pdia.events", "topic", { durable: true });
    console.log("✅ RabbitMQ connected");
  } catch (error) {
    console.error("❌ RabbitMQ connection failed:", error);
    throw error;
  }
}

export async function publishEvent(routingKey: string, message: object): Promise<void> {
  if (!channel) return;
  channel.publish("pdia.events", routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
}

export async function subscribeToWeather(): Promise<void> {
  if (!channel) return;
  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, "pdia.events", "weather.updated");
  channel.consume(q.queue, async (msg: any) => {
    if (msg) {
      const weather = JSON.parse(msg.content.toString());
      await handleWeatherUpdate(weather);
      channel?.ack(msg);
    }
  });
}

async function handleWeatherUpdate(weather: any): Promise<void> {
  const alertService = new (await import("../services/alert.service.js")).AlertService();
  await alertService.generateFromWeather(weather);
}

export { pool } from "./db.js";