import { pool } from "../config/db.js";
import { Recomendacion, TipoRecomendacion } from "../models/recommendation.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class RecommendationService {
  async generateFromWeather(weather: { cultivoId: number; temperature: number; probabilidadLluvia: number; }): Promise<void> {
    if (weather.temperature > 28 && weather.probabilidadLluvia < 30) {
      await this.create({ tipo: TipoRecomendacion.RIEGO, descripcion: "Temperatura alta y baja probabilidad de lluvia. Se recomienda riego adicional.", cultivoId: weather.cultivoId });
    }
  }

  async generateFromActividad(actividad: { cultivoId: number; tipo: string; }): Promise<void> {
    if (actividad.tipo === "PLAGA") {
      await this.create({ tipo: TipoRecomendacion.FITORECOMENDACION, descripcion: "Se detect plaga. Se recomienda aplica control fitosanitario.", cultivoId: actividad.cultivoId });
    }
  }

  async create(data: { tipo: TipoRecomendacion; descripcion: string; cultivoId: number }): Promise<Recomendacion> {
    const result = await pool.query(`INSERT INTO recomendaciones (tipo, descripcion, fecha, cultivo_id) VALUES ($1, $2, NOW(), $3) RETURNING *`, [data.tipo, data.descripcion, data.cultivoId]);
    const rec = new Recomendacion(result.rows[0]);
    await publishEvent("recommendation.creada", { recommendationId: rec.getId(), tipo: data.tipo, cultivoId: data.cultivoId });
    console.log(`💡 Recomendación creada: ${data.tipo} para cultivo ${data.cultivoId}`);
    return rec;
  }

  async listByUser(userId: number): Promise<Recomendacion[]> {
    const result = await pool.query(`SELECT r.* FROM recomendaciones r JOIN cultivos c ON r.cultivo_id = c.id JOIN parcelas p ON c.parcela_id = p.id JOIN fincas f ON p.finca_id = f.id WHERE f.propietario_id = $1 ORDER BY r.fecha DESC`, [userId]);
    return result.rows.map((row: any) => new Recomendacion(row));
  }
}