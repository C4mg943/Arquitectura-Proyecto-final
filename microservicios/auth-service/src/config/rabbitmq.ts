import amqp from "amqplib";

let connection: any = null;
let channel: any = null;

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
    console.warn("⚠️ RabbitMQ not connected, event not published:", routingKey);
    return;
  }

  try {
    channel.publish(
      "pdia.events",
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log("📤 Event published:", routingKey);
  } catch (error) {
    console.error("❌ Failed to publish event:", error);
  }
}

export async function subscribeEvent(
  routingKey: string,
  handler: (message: object) => Promise<void>
): Promise<void> {
  if (!channel) {
    console.error("❌ Cannot subscribe: RabbitMQ not connected");
    return;
  }

  try {
    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, "pdia.events", routingKey);

    channel.consume(q.queue, async (msg: any) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          channel?.ack(msg);
        } catch (error) {
          console.error("❌ Error processing message:", error);
          channel?.nack(msg, false, false);
        }
      }
    });

    console.log("📥 Subscribed to:", routingKey);
  } catch (error) {
    console.error("❌ Failed to subscribe:", error);
  }
}

export function getChannel(): any {
  return channel;
}