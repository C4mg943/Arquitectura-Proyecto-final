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
  const cultivoQ = await channel.assertQueue("", { exclusive: true });

  await channel.bindQueue(weatherQ.queue, "pdia.events", "weather.updated");
  await channel.bindQueue(actividadQ.queue, "pdia.events", "actividad.created");
  await channel.bindQueue(cultivoQ.queue, "pdia.events", "cultivo.created");

  // RF30: recomendación de riego por clima
  channel.consume(weatherQ.queue, async (msg: any) => {
    if (msg) {
      try {
        const weather = JSON.parse(msg.content.toString());
        const recService = new (await import("../services/recommendation.service.js")).RecommendationService();
        await recService.generateFromWeather(weather);
      } catch (e) { console.error("Error procesando weather.updated:", e); }
      channel?.ack(msg);
    }
  });

  // RF58: recomendación fitosanitaria al detectar plaga
  channel.consume(actividadQ.queue, async (msg: any) => {
    if (msg) {
      try {
        const actividad = JSON.parse(msg.content.toString());
        const recService = new (await import("../services/recommendation.service.js")).RecommendationService();
        await recService.generateFromActividad(actividad);
      } catch (e) { console.error("Error procesando actividad.created:", e); }
      channel?.ack(msg);
    }
  });

  // RF31: recomendación de fertilización al crear cultivo
  channel.consume(cultivoQ.queue, async (msg: any) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        if (event.cultivoId && event.tipoCultivo) {
          const recService = new (await import("../services/recommendation.service.js")).RecommendationService();
          await recService.generateFertilizacionForCultivo(event.cultivoId, event.tipoCultivo);
        }
      } catch (e) { console.error("Error procesando cultivo.created:", e); }
      channel?.ack(msg);
    }
  });
}

export { pool } from "./db.js";