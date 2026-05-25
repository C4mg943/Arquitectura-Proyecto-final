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

// ─── helpers ────────────────────────────────────────────────────────────────

async function getUserName(userId: number): Promise<string> {
  try {
    const r = await pool.query("SELECT nombre FROM users WHERE id = $1", [userId]);
    return (r.rows[0]?.nombre as string) ?? `Usuario #${userId}`;
  } catch {
    return `Usuario #${userId}`;
  }
}

async function getParcelaNombre(parcelaId: number): Promise<string> {
  try {
    const r = await pool.query("SELECT nombre FROM parcelas WHERE id = $1", [parcelaId]);
    return (r.rows[0]?.nombre as string) ?? `Parcela #${parcelaId}`;
  } catch {
    return `Parcela #${parcelaId}`;
  }
}

async function getCultivoNombre(cultivoId: number): Promise<string> {
  try {
    const r = await pool.query("SELECT tipo_cultivo FROM cultivos WHERE id = $1", [cultivoId]);
    return (r.rows[0]?.tipo_cultivo as string) ?? `Cultivo #${cultivoId}`;
  } catch {
    return `Cultivo #${cultivoId}`;
  }
}

async function getFincaNombre(fincaId: number): Promise<string> {
  try {
    const r = await pool.query("SELECT nombre FROM fincas WHERE id = $1", [fincaId]);
    return (r.rows[0]?.nombre as string) ?? `Finca #${fincaId}`;
  } catch {
    return `Finca #${fincaId}`;
  }
}

/** Obtiene todos los técnicos asignados a un productor */
async function getTecnicosDeProductor(productorId: number): Promise<number[]> {
  try {
    const r = await pool.query(
      "SELECT tecnico_id FROM asignacion_tecnicos WHERE productor_id = $1",
      [productorId]
    );
    return r.rows.map((row: any) => row.tecnico_id as number);
  } catch {
    return [];
  }
}

/** Obtiene todos los operarios asignados a las parcelas de un cultivo */
async function getOperariosDelCultivo(cultivoId: number): Promise<number[]> {
  try {
    const r = await pool.query(
      `SELECT DISTINCT ao.operario_id FROM asignacion_operarios ao
       JOIN parcelas p ON ao.parcela_id = p.id
       JOIN cultivos c ON p.id = c.parcela_id
       WHERE c.id = $1`,
      [cultivoId]
    );
    return r.rows.map((row: any) => row.operario_id as number);
  } catch {
    return [];
  }
}

// ─── mapper principal ────────────────────────────────────────────────────────

async function eventToNotifications(
  routingKey: string,
  event: RawEvent,
): Promise<NotificationToPersist[]> {
  const notifications: NotificationToPersist[] = [];

  // ── Bienvenida al registrarse ──────────────────────────────────────────────
  if (routingKey === "user.registered") {
    const userId = typeof event.userId === "number" ? event.userId : null;
    if (!userId) return [];
    return [{
      userId,
      tipo: routingKey,
      titulo: "👋 Bienvenido a PDIA",
      mensaje: "Tu cuenta se creó correctamente. Explora el panel para comenzar.",
    }];
  }

  // ── Alerta climática → productor ──────────────────────────────────────────
  if (routingKey === "alerta.creada") {
    const userId = typeof event.userId === "number" ? event.userId : null;
    if (!userId) return [];
    const cultivoNombre = typeof event.cultivoId === "number"
      ? await getCultivoNombre(event.cultivoId as number)
      : `Cultivo #${event.cultivoId}`;
    const tipoAlerta = String(event.tipo ?? "climática");
    const valor = event.valor ?? "";
    return [{
      userId,
      tipo: routingKey,
      titulo: "⚠️ Alerta del sistema",
      mensaje: `Alerta de ${tipoAlerta} (valor: ${valor}) detectada en ${cultivoNombre}. Revisa el estado del cultivo.`,
    }];
  }

  // ── Recomendación de técnico → productor + operarios ─────────────────────
  if (routingKey === "recommendation.creada") {
    const propietarioId = typeof event.propietarioId === "number" ? event.propietarioId : null;
    const cultivoId = typeof event.cultivoId === "number" ? event.cultivoId : null;
    const tipo = String(event.tipo ?? "técnica");
    const operarioIds = Array.isArray(event.operarioIds) ? (event.operarioIds as number[]) : [];

    if (!cultivoId) return [];
    const cultivoNombre = await getCultivoNombre(cultivoId);

    if (propietarioId) {
      notifications.push({
        userId: propietarioId,
        tipo: routingKey,
        titulo: "💡 Nueva recomendación técnica",
        mensaje: `Tu técnico creó una recomendación de ${tipo} para ${cultivoNombre}.`,
      });
    }
    for (const opId of operarioIds) {
      notifications.push({
        userId: opId,
        tipo: routingKey,
        titulo: "💡 Nueva recomendación técnica",
        mensaje: `Se creó una recomendación de ${tipo} para ${cultivoNombre} en tu parcela.`,
      });
    }
    return notifications;
  }

  // ── Operario asignado a parcela → operario ────────────────────────────────
  if (routingKey === "operario.asignado") {
    const operarioId = typeof event.operarioId === "number" ? event.operarioId : null;
    const parcelaId = typeof event.parcelaId === "number" ? event.parcelaId : null;
    if (!operarioId || !parcelaId) return [];
    const parcelaNombre = await getParcelaNombre(parcelaId);
    return [{
      userId: operarioId,
      tipo: routingKey,
      titulo: "📋 Nueva asignación de parcela",
      mensaje: `Se te asignó la parcela "${parcelaNombre}". Ya puedes registrar actividades en sus cultivos.`,
    }];
  }

  // ── Técnico asignado a productor → técnico ────────────────────────────────
  if (routingKey === "tecnico.asignado") {
    const tecnicoId = typeof event.tecnicoId === "number" ? event.tecnicoId : null;
    const productorId = typeof event.productorId === "number" ? event.productorId : null;
    if (!tecnicoId || !productorId) return [];
    const productorNombre = await getUserName(productorId);
    return [{
      userId: tecnicoId,
      tipo: routingKey,
      titulo: "🔬 Nueva asignación como técnico",
      mensaje: `Ahora eres técnico agrónomo de ${productorNombre}. Puedes ver sus fincas y crear recomendaciones.`,
    }];
  }

  // ── Actividad creada por operario → productor + técnicos ─────────────────
  if (routingKey === "actividad.created") {
    const cultivoId = typeof event.cultivoId === "number" ? event.cultivoId : null;
    const usuarioId = typeof event.usuarioId === "number" ? event.usuarioId : null;
    const tipo = String(event.tipo ?? "actividad");
    if (!cultivoId || !usuarioId) return [];

    try {
      const userRes = await pool.query("SELECT rol, nombre FROM users WHERE id = $1", [usuarioId]);
      if (!userRes.rows[0]) return [];
      const { rol, nombre: operarioNombre } = userRes.rows[0] as { rol: string; nombre: string };

      // Solo notificar cuando es un OPERARIO quien registra
      if (rol !== "OPERARIO") return [];

      const cultivoNombre = await getCultivoNombre(cultivoId);

      const propietarioRes = await pool.query(
        `SELECT f.propietario_id FROM fincas f
         JOIN parcelas p ON f.id = p.finca_id
         JOIN cultivos c ON p.id = c.parcela_id
         WHERE c.id = $1`,
        [cultivoId]
      );
      if (!propietarioRes.rows[0]) return [];
      const productorId = propietarioRes.rows[0].propietario_id as number;

      // Notificar al productor
      notifications.push({
        userId: productorId,
        tipo: routingKey,
        titulo: "🌱 Actividad registrada por operario",
        mensaje: `${operarioNombre} registró un ${tipo.toLowerCase()} en ${cultivoNombre}.`,
      });

      // Notificar a los técnicos del productor
      const tecnicoIds = await getTecnicosDeProductor(productorId);
      for (const tecId of tecnicoIds) {
        notifications.push({
          userId: tecId,
          tipo: routingKey,
          titulo: "🌱 Nueva actividad en cultivo asignado",
          mensaje: `${operarioNombre} registró un ${tipo.toLowerCase()} en ${cultivoNombre}.`,
        });
      }
    } catch {
      return [];
    }
    return notifications;
  }

  // ── Cultivo creado → productor (si lo creó un operario) + técnicos ────────
  if (routingKey === "cultivo.created") {
    const cultivoId = typeof event.cultivoId === "number" ? event.cultivoId : null;
    const propietarioId = typeof event.propietarioId === "number" ? event.propietarioId : null;
    const creadoPorId = typeof event.creadoPorId === "number" ? event.creadoPorId : null;
    const creadoPorRol = String(event.creadoPorRol ?? "");
    const tipoCultivo = String(event.tipoCultivo ?? "cultivo");
    if (!cultivoId) return [];

    // Si lo creó un operario, notificar al productor
    if (creadoPorRol === "OPERARIO" && propietarioId && creadoPorId) {
      const operarioNombre = await getUserName(creadoPorId);
      notifications.push({
        userId: propietarioId,
        tipo: routingKey,
        titulo: "🌿 Nuevo cultivo registrado",
        mensaje: `${operarioNombre} registró un nuevo cultivo de ${tipoCultivo} en tu finca.`,
      });
    }

    // Notificar a los técnicos del productor
    if (propietarioId) {
      const tecnicoIds = await getTecnicosDeProductor(propietarioId);
      const creadoPorNombre = creadoPorId ? await getUserName(creadoPorId) : "alguien";
      for (const tecId of tecnicoIds) {
        notifications.push({
          userId: tecId,
          tipo: routingKey,
          titulo: "🌿 Nuevo cultivo en finca asignada",
          mensaje: `${creadoPorNombre} registró un cultivo de ${tipoCultivo}. Revisa para dar recomendaciones.`,
        });
      }
    }
    return notifications;
  }

  // ── Cultivo actualizado → productor + técnicos + operarios ───────────────
  if (routingKey === "cultivo.updated") {
    const cultivoId = typeof event.cultivoId === "number" ? event.cultivoId : null;
    const propietarioId = typeof event.propietarioId === "number" ? event.propietarioId : null;
    const actualizadoPorId = typeof event.actualizadoPorId === "number" ? event.actualizadoPorId : null;
    const actualizadoPorRol = String(event.actualizadoPorRol ?? "");
    const tipoCultivo = String(event.tipoCultivo ?? "cultivo");
    const nuevoEstado = String((event.cambios as any)?.estado ?? "");
    if (!cultivoId) return [];

    const actualizadoPorNombre = actualizadoPorId ? await getUserName(actualizadoPorId) : "alguien";
    const estadoMsg = nuevoEstado ? ` Estado: ${nuevoEstado}.` : "";

    // Notificar al productor si no fue él quien actualizó
    if (propietarioId && actualizadoPorRol !== "PRODUCTOR") {
      notifications.push({
        userId: propietarioId,
        tipo: routingKey,
        titulo: "✏️ Cultivo actualizado",
        mensaje: `${actualizadoPorNombre} actualizó el cultivo de ${tipoCultivo}.${estadoMsg}`,
      });
    }

    // Notificar a técnicos
    if (propietarioId) {
      const tecnicoIds = await getTecnicosDeProductor(propietarioId);
      for (const tecId of tecnicoIds) {
        if (actualizadoPorId === tecId) continue; // no notificar al que hizo el cambio
        notifications.push({
          userId: tecId,
          tipo: routingKey,
          titulo: "✏️ Cultivo actualizado",
          mensaje: `${actualizadoPorNombre} actualizó el cultivo de ${tipoCultivo}.${estadoMsg}`,
        });
      }
    }

    // Notificar a operarios de ese cultivo (si no fue uno de ellos quien actualizó)
    const operarioIds = await getOperariosDelCultivo(cultivoId);
    for (const opId of operarioIds) {
      if (actualizadoPorId === opId) continue;
      notifications.push({
        userId: opId,
        tipo: routingKey,
        titulo: "✏️ Cultivo actualizado",
        mensaje: `${actualizadoPorNombre} actualizó el cultivo de ${tipoCultivo}.${estadoMsg}`,
      });
    }
    return notifications;
  }

  // ── Parcela creada → productor + técnicos ─────────────────────────────────
  if (routingKey === "parcela.created") {
    const propietarioId = typeof event.propietarioId === "number" ? event.propietarioId : null;
    const parcelaNombre = String(event.parcelaNombre ?? `Parcela #${event.parcelaId}`);
    const municipio = String(event.municipio ?? "");
    if (!propietarioId) return [];

    // Notificar a los técnicos del productor
    const tecnicoIds = await getTecnicosDeProductor(propietarioId);
    for (const tecId of tecnicoIds) {
      notifications.push({
        userId: tecId,
        tipo: routingKey,
        titulo: "🗺️ Nueva parcela registrada",
        mensaje: `Se registró la parcela "${parcelaNombre}"${municipio ? ` en ${municipio}` : ""} en una finca que supervisas.`,
      });
    }
    return notifications;
  }

  return [];
}

// ─── suscriptor ──────────────────────────────────────────────────────────────

export async function subscribeEvents(): Promise<void> {
  if (!channel) return;

  const q = await channel.assertQueue("", { exclusive: true });

  const events = [
    "alerta.creada",
    "recommendation.creada",
    "user.registered",
    "operario.asignado",
    "tecnico.asignado",
    "actividad.created",
    "cultivo.created",
    "cultivo.updated",
    "parcela.created",
  ];

  for (const event of events) {
    await channel.bindQueue(q.queue, "pdia.events", event);
  }

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const routingKey = msg.fields.routingKey;
      const event = JSON.parse(msg.content.toString()) as RawEvent;

      const notifications = await eventToNotifications(routingKey, event);

      if (notifications.length === 0) {
        console.log(`ℹ️ Event ${routingKey} — sin destinatarios`);
        channel?.ack(msg);
        return;
      }

      for (const n of notifications) {
        await pool.query(
          "INSERT INTO notificaciones (user_id, tipo, titulo, mensaje) VALUES ($1, $2, $3, $4)",
          [n.userId, n.tipo, n.titulo, n.mensaje],
        );
        console.log(`🔔 [${routingKey}] → usuario ${n.userId}: ${n.titulo}`);
      }

      channel?.ack(msg);
    } catch (error) {
      console.error("❌ Error procesando evento:", error);
      channel?.nack(msg, false, false);
    }
  });
}
