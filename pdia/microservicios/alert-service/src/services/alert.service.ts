import { pool } from "../config/db.js";
import { Alerta, TipoAlerta } from "../models/alert.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class AlertService {
  async generateFromWeather(weather: {
    parcelaId: number;
    cultivoId: number;
    temperature: number;
    probabilidadLluvia: number;
    velocidadViento: number;
  }): Promise<void> {
    const alertas: { tipo: TipoAlerta; valor: number }[] = [];

    if (weather.probabilidadLluvia > 70) {
      alertas.push({ tipo: TipoAlerta.LLUVIA, valor: weather.probabilidadLluvia });
    }
    if (weather.temperature > 35) {
      alertas.push({ tipo: TipoAlerta.TEMPERATURA_ALTA, valor: weather.temperature });
    }
    if (weather.temperature < 15) {
      alertas.push({ tipo: TipoAlerta.TEMPERATURA_BAJA, valor: weather.temperature });
    }
    if (weather.velocidadViento > 50) {
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

    const alerta = new Alerta(result.rows[0]);
    await publishEvent("alerta.creada", { alertId: alerta.getId(), tipo: data.tipo, cultivoId: data.cultivoId });

    console.log(`⚠️ Alerta creada: ${data.tipo} - ${data.valor} para cultivo ${data.cultivoId}`);
    return alerta;
  }

  async listByUser(userId: number): Promise<Alerta[]> {
    const result = await pool.query(
      `SELECT a.* FROM alertas a
       JOIN cultivos c ON a.cultivo_id = c.id
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       WHERE f.propietario_id = $1
       ORDER BY a.fecha DESC`,
      [userId]
    );
    return result.rows.map((row) => new Alerta(row));
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