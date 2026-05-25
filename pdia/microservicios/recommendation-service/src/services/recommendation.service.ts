import { pool } from "../config/db.js";
import { Recomendacion, TipoRecomendacion, OrigenRecomendacion } from "../models/recommendation.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class RecommendationService {
  // ── RF30: Recomendación automática de riego por clima ─────────────────────
  async generateFromWeather(weather: { cultivoId: number; temperature: number; probabilidadLluvia: number; }): Promise<void> {
    if (weather.temperature > 28 && weather.probabilidadLluvia < 30) {
      await this.createInternal({
        tipo: TipoRecomendacion.RIEGO,
        descripcion: "Temperatura alta y baja probabilidad de lluvia. Se recomienda riego adicional para mantener la humedad del suelo.",
        cultivoId: weather.cultivoId,
        origen: OrigenRecomendacion.SISTEMA,
      });
    }
  }

  // ── RF58: Recomendación fitosanitaria al detectar plaga ───────────────────
  async generateFromActividad(actividad: { cultivoId: number; tipo: string; }): Promise<void> {
    if (actividad.tipo === "PLAGA") {
      await this.createInternal({
        tipo: TipoRecomendacion.FITORECOMENDACION,
        descripcion: "Se detectó una plaga en el cultivo. Se recomienda aplicar control fitosanitario y monitorear la propagación.",
        cultivoId: actividad.cultivoId,
        origen: OrigenRecomendacion.SISTEMA,
      });
    }
  }

  // ── RF31: Recomendación de fertilización por tipo de cultivo ─────────────
  async generateFertilizacionForCultivo(cultivoId: number, tipoCultivo: string): Promise<void> {
    const recomendaciones: Record<string, string> = {
      "Maíz":   "El maíz requiere fertilización nitrogenada en etapa de crecimiento. Se recomienda aplicar urea o nitrato de amonio.",
      "Arroz":  "El arroz se beneficia de fertilización con nitrógeno y fósforo. Aplicar en etapa de macollamiento.",
      "Frijol": "El frijol fija nitrógeno atmosférico. Priorizar fertilización con fósforo y potasio.",
      "Tomate": "El tomate requiere fertilización balanceada NPK. Aumentar potasio en etapa de fructificación.",
      "Papaya": "La papaya responde bien a fertilización orgánica. Aplicar compost y complementar con NPK.",
      "Banano": "El banano requiere altas dosis de potasio. Fertilizar cada 2 meses con mezcla K-N.",
      "Café":   "El café necesita fertilización con nitrógeno, fósforo y potasio. Aplicar después de la cosecha.",
      "Cacao":  "El cacao se beneficia de fertilización orgánica y micronutrientes como zinc y boro.",
      "Yuca":   "La yuca requiere poca fertilización. Aplicar potasio para mejorar el rendimiento de raíces.",
      "Ñame":   "El ñame responde bien a materia orgánica. Complementar con potasio para desarrollo de tubérculos.",
    };

    const descripcion = recomendaciones[tipoCultivo]
      ?? `Se recomienda realizar análisis de suelo para determinar el plan de fertilización adecuado para ${tipoCultivo}.`;

    await this.createInternal({
      tipo: TipoRecomendacion.FERTILIZACION,
      descripcion,
      cultivoId,
      origen: OrigenRecomendacion.SISTEMA,
    });
  }

  // ── Crear recomendación interna (sistema) ─────────────────────────────────
  private async createInternal(data: {
    tipo: TipoRecomendacion;
    descripcion: string;
    cultivoId: number;
    origen: OrigenRecomendacion;
  }): Promise<Recomendacion> {
    const result = await pool.query(
      `INSERT INTO recomendaciones (tipo, descripcion, fecha, cultivo_id, origen) VALUES ($1, $2, NOW(), $3, $4) RETURNING *`,
      [data.tipo, data.descripcion, data.cultivoId, data.origen]
    );
    const rec = new Recomendacion(result.rows[0]);

    const propietarioRes = await pool.query(
      `SELECT f.propietario_id FROM fincas f
       JOIN parcelas p ON f.id = p.finca_id
       JOIN cultivos c ON p.id = c.parcela_id
       WHERE c.id = $1`,
      [data.cultivoId]
    );
    const propietarioId = propietarioRes.rows[0]?.propietario_id ?? null;

    const operariosRes = await pool.query(
      `SELECT ao.operario_id FROM asignacion_operarios ao
       JOIN parcelas p ON ao.parcela_id = p.id
       JOIN cultivos c ON p.id = c.parcela_id
       WHERE c.id = $1`,
      [data.cultivoId]
    );
    const operarioIds = operariosRes.rows.map((r: any) => r.operario_id as number);

    await publishEvent("recommendation.creada", {
      recommendationId: rec.getId(),
      tipo: data.tipo,
      cultivoId: data.cultivoId,
      origen: data.origen,
      propietarioId,
      operarioIds,
    });
    console.log(`💡 Recomendación [${data.origen}] creada: ${data.tipo} para cultivo ${data.cultivoId}`);
    return rec;
  }

  // ── Crear recomendación manual (técnico) ──────────────────────────────────
  async create(data: { tipo: TipoRecomendacion; descripcion: string; cultivoId: number }): Promise<Recomendacion> {
    const result = await pool.query(
      `INSERT INTO recomendaciones (tipo, descripcion, fecha, cultivo_id, origen) VALUES ($1, $2, NOW(), $3, $4) RETURNING *`,
      [data.tipo, data.descripcion, data.cultivoId, OrigenRecomendacion.TECNICO]
    );
    const rec = new Recomendacion(result.rows[0]);

    const propietarioRes = await pool.query(
      `SELECT f.propietario_id FROM fincas f
       JOIN parcelas p ON f.id = p.finca_id
       JOIN cultivos c ON p.id = c.parcela_id
       WHERE c.id = $1`,
      [data.cultivoId]
    );
    const propietarioId = propietarioRes.rows[0]?.propietario_id ?? null;

    const operariosRes = await pool.query(
      `SELECT ao.operario_id FROM asignacion_operarios ao
       JOIN parcelas p ON ao.parcela_id = p.id
       JOIN cultivos c ON p.id = c.parcela_id
       WHERE c.id = $1`,
      [data.cultivoId]
    );
    const operarioIds = operariosRes.rows.map((r: any) => r.operario_id as number);

    await publishEvent("recommendation.creada", {
      recommendationId: rec.getId(),
      tipo: data.tipo,
      cultivoId: data.cultivoId,
      origen: OrigenRecomendacion.TECNICO,
      propietarioId,
      operarioIds,
    });
    console.log(`💡 Recomendación [TECNICO] creada: ${data.tipo} para cultivo ${data.cultivoId}`);
    return rec;
  }

  async listByUser(userId: number, rol: string): Promise<Recomendacion[]> {
    let result;
    if (rol === "OPERARIO") {
      result = await pool.query(
        `SELECT r.* FROM recomendaciones r
         JOIN cultivos c ON r.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE ao.operario_id = $1
         ORDER BY r.fecha DESC`,
        [userId]
      );
    } else {
      result = await pool.query(
        `SELECT r.* FROM recomendaciones r
         JOIN cultivos c ON r.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE f.propietario_id = $1
         ORDER BY r.fecha DESC`,
        [userId]
      );
    }
    return result.rows.map((row: any) => new Recomendacion(row));
  }

  async listByTecnico(tecnicoId: number): Promise<Recomendacion[]> {
    // El técnico solo ve las que él creó (origen = TECNICO)
    const result = await pool.query(
      `SELECT r.* FROM recomendaciones r
       JOIN cultivos c ON r.cultivo_id = c.id
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
       WHERE at.tecnico_id = $1 AND r.origen = 'TECNICO'
       ORDER BY r.fecha DESC`,
      [tecnicoId]
    );
    return result.rows.map((row: any) => new Recomendacion(row));
  }

  async listByCultivo(cultivoId: number, userId: number, rol: string): Promise<Recomendacion[]> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query(
        `SELECT * FROM recomendaciones WHERE cultivo_id = $1 ORDER BY fecha DESC`,
        [cultivoId]
      );
    } else if (rol === "TECNICO") {
      result = await pool.query(
        `SELECT r.* FROM recomendaciones r
         JOIN cultivos c ON r.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
         WHERE r.cultivo_id = $1 AND at.tecnico_id = $2
         ORDER BY r.fecha DESC`,
        [cultivoId, userId]
      );
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT r.* FROM recomendaciones r
         JOIN cultivos c ON r.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE r.cultivo_id = $1 AND f.propietario_id = $2
         ORDER BY r.fecha DESC`,
        [cultivoId, userId]
      );
    } else {
      result = await pool.query(
        `SELECT r.* FROM recomendaciones r
         JOIN cultivos c ON r.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE r.cultivo_id = $1 AND ao.operario_id = $2
         ORDER BY r.fecha DESC`,
        [cultivoId, userId]
      );
    }
    return result.rows.map((row: any) => new Recomendacion(row));
  }
}