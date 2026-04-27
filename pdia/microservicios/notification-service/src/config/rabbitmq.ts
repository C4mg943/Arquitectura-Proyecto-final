import amqp, { Channel } from "amqplib";
import { pool } from "./db.js";

let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  const host = process.env.RABBITMQ_HOST || "localhost";
  const port = process.env.RABBITMQ_PORT || "5672";
  const connection = await amqp.connect(`amqp://guest:guest@${host}:${port}`);
  channel = await connection.createChannel();
  await channel.assertExchange("pdia.events", "topic", { durable: true });
  console.log("✅ RabbitMQ connected");
}

export async function subscribeEvents(): Promise<void> {
  if (!channel) return;

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, "pdia.events", "alerta.creada");
  await channel.bindQueue(q.queue, "pdia.events", "recommendation.creada");

  channel.consume(q.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      const titulo = routingKey === "alerta.creada" ? "Nueva Alerta" : "Nueva Recomendación";
      const mensaje = routingKey === "alerta.creada"
        ? `Se ha generado una alerta de tipo ${event.tipo}`
        : `Se ha generado una recomendación de tipo ${event.tipo}`;

      await pool.query(
        "INSERT INTO notificaciones (user_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)",
        [1, routingKey, titulo, mensaje]
      );

      channel?.ack(msg);
    }
  });
}