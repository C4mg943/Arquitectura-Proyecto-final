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

      if (!event.userId) {
        console.warn(`Event ${routingKey} ignored: no userId provided`, event);
        channel?.ack(msg);
        return;
      }

      const titulo = routingKey === "alerta.creada" ? "⚠️ Nueva Alerta Climática" : "💡 Nueva Recomendación";
      let mensaje = "";

      if (routingKey === "alerta.creada") {
        mensaje = `Se detectó: ${event.tipo} con un valor de ${event.valor}. Revisa tu cultivo #${event.cultivoId}.`;
      } else {
        mensaje = `Nueva recomendación de tipo ${event.tipo} para tu cultivo.`;
      }

      await pool.query(
        "INSERT INTO notificaciones (user_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)",
        [event.userId, routingKey, titulo, mensaje]
      );

      console.log(`🔔 Notificación guardada para usuario ${event.userId}: ${titulo}`);
      channel?.ack(msg);
    }
  });
}