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

interface RawEvent {
  [key: string]: unknown;
}

interface NotificationToPersist {
  userId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
}

/**
 * Mapea un evento de la cola a una o más notificaciones a persistir.
 * Retorna un array vacío si el evento no aplica para ningún usuario.
 */
async function eventToNotifications(
  routingKey: string,
  event: RawEvent,
): Promise<NotificationToPersist[]> {
  if (routingKey === "alerta.creada") {
    const userId = typeof event.userId === "number" ? event.userId : null;
    if (!userId) return [];
    return [
      {
        userId,
        tipo: routingKey,
        titulo: "⚠️ Nueva Alerta Climática",
        mensaje: `Se detectó: ${event.tipo} con un valor de ${event.valor}. Revisa tu cultivo #${event.cultivoId}.`,
      },
    ];
  }

  if (routingKey === "recommendation.creada") {
    const userId = typeof event.userId === "number" ? event.userId : null;
    if (!userId) return [];
    return [
      {
        userId,
        tipo: routingKey,
        titulo: "💡 Nueva Recomendación",
        mensaje: `Nueva recomendación de tipo ${event.tipo} para tu cultivo.`,
      },
    ];
  }

  if (routingKey === "user.registered") {
    const userId = typeof event.userId === "number" ? event.userId : null;
    if (!userId) return [];
    return [
      {
        userId,
        tipo: routingKey,
        titulo: "👋 Bienvenido a PDIA",
        mensaje:
          "Tu cuenta se creó correctamente. Explora el panel para comenzar a registrar tus actividades.",
      },
    ];
  }

  if (routingKey === "operario.asignado") {
    // farm-service publica { operarioId, parcelaId }. Enriquecemos con nombre de parcela.
    const operarioId = typeof event.operarioId === "number" ? event.operarioId : null;
    const parcelaId = typeof event.parcelaId === "number" ? event.parcelaId : null;
    if (!operarioId || !parcelaId) return [];

    let parcelaNombre = `#${parcelaId}`;
    try {
      const result = await pool.query(
        "SELECT nombre FROM parcelas WHERE id = $1",
        [parcelaId],
      );
      if (result.rows[0]?.nombre) {
        parcelaNombre = result.rows[0].nombre;
      }
    } catch {
      // ignorar: seguimos con el id como nombre
    }

    return [
      {
        userId: operarioId,
        tipo: routingKey,
        titulo: "📋 Nueva asignación",
        mensaje: `Se te asignó la parcela "${parcelaNombre}". Revisa los cultivos asociados.`,
      },
    ];
  }

  return [];
}

export async function subscribeEvents(): Promise<void> {
  if (!channel) return;

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, "pdia.events", "alerta.creada");
  await channel.bindQueue(q.queue, "pdia.events", "recommendation.creada");
  await channel.bindQueue(q.queue, "pdia.events", "user.registered");
  await channel.bindQueue(q.queue, "pdia.events", "operario.asignado");

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const routingKey = msg.fields.routingKey;
      const event = JSON.parse(msg.content.toString()) as RawEvent;

      const notifications = await eventToNotifications(routingKey, event);

      if (notifications.length === 0) {
        console.warn(`Event ${routingKey} ignored (sin destinatario)`, event);
        channel?.ack(msg);
        return;
      }

      for (const n of notifications) {
        await pool.query(
          "INSERT INTO notificaciones (user_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)",
          [n.userId, n.tipo, n.titulo, n.mensaje],
        );
        console.log(`🔔 Notificación guardada para usuario ${n.userId}: ${n.titulo}`);
      }

      channel?.ack(msg);
    } catch (error) {
      console.error("❌ Error procesando evento de notificación:", error);
      // No ack → el mensaje se reintregará a la cola (excluyente, se reintenta)
      channel?.nack(msg, false, false);
    }
  });
}
