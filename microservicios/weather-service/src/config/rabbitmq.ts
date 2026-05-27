import amqp, { Channel } from "amqplib";

let channel: Channel | null = null;
type RabbitMessageHandler = (routingKey: string, payload: Record<string, unknown>) => Promise<void> | void;

export async function connectRabbitMQ(): Promise<void> {
  try {
    const host = process.env.RABBITMQ_HOST || "localhost";
    const port = process.env.RABBITMQ_PORT || "5672";
    const connection = await amqp.connect(`amqp://guest:guest@${host}:${port}`);
    channel = await connection.createChannel();
    await channel.assertExchange("pdia.events", "topic", { durable: true });
    console.log("✅ RabbitMQ connected");
  } catch (error) {
    console.error("❌ RabbitMQ connection failed:", error);
  }
}

export async function publishEvent(routingKey: string, message: object): Promise<void> {
  if (!channel) return;
  channel.publish("pdia.events", routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
}

/**
 * Suscribe un handler a una lista de routing keys. Crea una cola exclusiva ligada
 * al exchange `pdia.events` (topic). El handler recibe (routingKey, payload).
 */
export async function subscribeToEvents(
  routingKeys: string[],
  handler: RabbitMessageHandler,
): Promise<void> {
  if (!channel) {
    console.warn("⚠️ RabbitMQ not connected, cannot subscribe");
    return;
  }

  const q = await channel.assertQueue("", { exclusive: true });
  for (const key of routingKeys) {
    await channel.bindQueue(q.queue, "pdia.events", key);
  }

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as Record<string, unknown>;
      await handler(msg.fields.routingKey, payload);
      channel?.ack(msg);
    } catch (error) {
      console.error(`❌ Error handling event ${msg.fields.routingKey}:`, error);
      channel?.nack(msg, false, false);
    }
  });
}

export { pool } from "./db.js";
