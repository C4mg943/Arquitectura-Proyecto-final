import { pool } from "../config/db.js";
import { Alerta, TipoAlerta } from "../models/alert.model.js";
import { publishEvent } from "../config/rabbitmq.js";

// Umbrales por defecto (fallback) si no existe una fila en la tabla `umbrales` para el cultivo
const DEFAULT_THRESHOLDS = {
  temperatura_min: 15,
  temperatura_max: 35,
  lluvia_max: 70,
  viento_max: 50,
};

interface Umbrales {
  temperatura_min: number;
  temperatura_max: number;
  lluvia_max: number;
  viento_max: number;
}

export class AlertService {
  private async getUmbralesForCultivo(cultivoId: number): Promise<Umbrales> {
    const result = await pool.query(
      `SELECT u.temperatura_min, u.temperatura_max, u.lluvia_max, u.viento_max
       FROM cultivos c
       LEFT JOIN umbrales u ON LOWER(c.tipo_cultivo) = LOWER(u.tipo_cultivo)
       WHERE c.id = $1`,
      [cultivoId]
    );

    const row = result.rows[0];
    if (!row) return { ...DEFAULT_THRESHOLDS };

    return {
      temperatura_min: row.temperatura_min !== null ? Number(row.temperatura_min) : DEFAULT_THRESHOLDS.temperatura_min,
      temperatura_max: row.temperatura_max !== null ? Number(row.temperatura_max) : DEFAULT_THRESHOLDS.temperatura_max,
      lluvia_max: row.lluvia_max !== null ? Number(row.lluvia_max) : DEFAULT_THRESHOLDS.lluvia_max,
      viento_max: row.viento_max !== null ? Number(row.viento_max) : DEFAULT_THRESHOLDS.viento_max,
    };
  }

  async generateFromWeather(weather: {
    parcelaId: number;
    cultivoId: number;
    temperature: number;
    probabilidadLluvia: number;
    velocidadViento: number;
  }): Promise<void> {
    const umbrales = await this.getUmbralesForCultivo(weather.cultivoId);
    const alertas: { tipo: TipoAlerta; valor: number }[] = [];

    if (weather.probabilidadLluvia > umbrales.lluvia_max) {
      alertas.push({ tipo: TipoAlerta.LLUVIA, valor: weather.probabilidadLluvia });
    }
    if (weather.temperature > umbrales.temperatura_max) {
      alertas.push({ tipo: TipoAlerta.TEMPERATURA_ALTA, valor: weather.temperature });
    }
    if (weather.temperature < umbrales.temperatura_min) {
      alertas.push({ tipo: TipoAlerta.TEMPERATURA_BAJA, valor: weather.temperature });
    }
    if (weather.velocidadViento > umbrales.viento_max) {
      alertas.push({ tipo: TipoAlerta.VIENTO, valor: weather.velocidadViento });
    }

    for (const alerta of alertas) {
      await this.create({ tipo: alerta.tipo, valor: alerta.valor, cultivoId: weather.cultivoId });
    }
  }

  async create(data: { tipo: TipoAlerta; valor: number; cultivoId: number }): Promise<Alerta> {
    const result = await pool.query(
      `INSERT INTO alertas (tipo, valor_detectado, fecha, cultivo_id) VALUES ($1, $2, NOW(), $3) RETURNING *`,
      [data.tipo, data.valor, data.cultivoId]
    );

    const propietarioRes = await pool.query(
      `SELECT f.propietario_id FROM fincas f
       JOIN parcelas p ON f.id = p.finca_id
       JOIN cultivos c ON p.id = c.parcela_id
       WHERE c.id = $1`,
      [data.cultivoId]
    );

    const userId = propietarioRes.rows[0]?.propietario_id;

    const alerta = new Alerta(result.rows[0]);
    await publishEvent("alerta.creada", { 
      alertId: alerta.getId(), 
      tipo: data.tipo, 
      cultivoId: data.cultivoId,
      valor: data.valor,
      userId 
    });

    console.log(`⚠️ Alerta creada: ${data.tipo} - ${data.valor} para cultivo ${data.cultivoId} (Usuario: ${userId})`);
    return alerta;
  }

  async listByUser(userId: number, rol: string): Promise<Alerta[]> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query(
        `SELECT * FROM alertas ORDER BY fecha DESC LIMIT 100`
      );
    } else if (rol === "OPERARIO") {
      result = await pool.query(
        `SELECT a.* FROM alertas a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE ao.operario_id = $1
         ORDER BY a.fecha DESC`,
        [userId]
      );
    } else {
      // PRODUCTOR y TECNICO: por propietario de la finca
      result = await pool.query(
        `SELECT a.* FROM alertas a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE f.propietario_id = $1
         ORDER BY a.fecha DESC`,
        [userId]
      );
    }
    return result.rows.map((row) => new Alerta(row));
  }

  async listByCultivo(cultivoId: number, userId: number, rol: string): Promise<Alerta[]> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query(
        `SELECT * FROM alertas WHERE cultivo_id = $1 ORDER BY fecha DESC`,
        [cultivoId]
      );
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM alertas a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE a.cultivo_id = $1 AND f.propietario_id = $2
         ORDER BY a.fecha DESC`,
        [cultivoId, userId]
      );
    } else {
      result = await pool.query(
        `SELECT a.* FROM alertas a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE a.cultivo_id = $1 AND ao.operario_id = $2
         ORDER BY a.fecha DESC`,
        [cultivoId, userId]
      );
    }
    return result.rows.map((row) => new Alerta(row));
  }

  async findById(alertId: number, userId: number, rol: string): Promise<Alerta | null> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query("SELECT * FROM alertas WHERE id = $1", [alertId]);
    } else {
      result = await pool.query(
        `SELECT a.* FROM alertas a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE a.id = $1 AND f.propietario_id = $2`,
        [alertId, userId]
      );
    }
    return result.rows[0] ? new Alerta(result.rows[0]) : null;
  }

  async delete(alertId: number, userId: number, rol: string): Promise<boolean> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query("DELETE FROM alertas WHERE id = $1 RETURNING id", [alertId]);
    } else {
      result = await pool.query(
        `DELETE FROM alertas a
         USING cultivos c, parcelas p, fincas f
         WHERE a.id = $1 AND a.cultivo_id = c.id AND c.parcela_id = p.id AND p.finca_id = f.id
         AND f.propietario_id = $2 RETURNING a.id`,
        [alertId, userId]
      );
    }
    return (result.rowCount ?? 0) > 0;
  }

  async markAsRead(alertId: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE alertas a SET leida = true
       FROM cultivos c, parcelas p, fincas f
       WHERE a.id = $1 AND a.cultivo_id = c.id AND c.parcela_id = p.id AND p.finca_id = f.id AND f.propietario_id = $2
       RETURNING a.id`,
      [alertId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}