import amqp from "amqplib";
let channel: any = null;

export async function connectRabbitMQ(): Promise<void> {
  const host = process.env.RABBITMQ_HOST || "localhost";
  const port = process.env.RABBITMQ_PORT || "5672";
  const connection = await amqp.connect(`amqp://guest:guest@${host}:${port}`);
  channel = await connection.createChannel();
  await channel.assertExchange("pdia.events", "topic", { durable: true });
  console.log("✅ RabbitMQ connected");
}

export async function publishEvent(routingKey: string, message: object): Promise<void> {
  if (!channel) return;
  channel.publish("pdia.events", routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
}

export async function subscribeEvents(): Promise<void> {
  if (!channel) return;
  const weatherQ = await channel.assertQueue("", { exclusive: true });
  const actividadQ = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(weatherQ.queue, "pdia.events", "weather.updated");
  await channel.bindQueue(actividadQ.queue, "pdia.events", "actividad.created");

  channel.consume(weatherQ.queue, async (msg: any) => {
    if (msg) {
      const weather = JSON.parse(msg.content.toString());
      const recService = new (await import("../services/recommendation.service.js")).RecommendationService();
      await recService.generateFromWeather(weather);
      channel?.ack(msg);
    }
  });

  channel.consume(actividadQ.queue, async (msg: any) => {
    if (msg) {
      const actividad = JSON.parse(msg.content.toString());
      const recService = new (await import("../services/recommendation.service.js")).RecommendationService();
      await recService.generateFromActividad(actividad);
      channel?.ack(msg);
    }
  });
}

export { pool } from "./db.js";