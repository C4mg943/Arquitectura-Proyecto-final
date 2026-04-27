import amqp, { ChannelModel, Channel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

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
  if (!channel) {
    console.warn("⚠️ RabbitMQ not connected");
    return;
  }

  try {
    channel.publish(
      "pdia.events",
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error("❌ Failed to publish event:", error);
  }
}

export { pool } from "./db.js";