import { pool } from "../config/db.js";
import { Cultivo, EstadoCultivo } from "../models/crop.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class CropService {
  async create(data: {
    tipoCultivo: string;
    fechaSiembra: string;
    estado: EstadoCultivo;
    observaciones?: string;
    parcelaId: number;
    usuarioId: number;
  }): Promise<Cultivo> {
    const result = await pool.query(
      `INSERT INTO cultivos (tipo_cultivo, fecha_siembra, estado, observaciones, parcela_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.tipoCultivo, data.fechaSiembra, data.estado, data.observaciones || null, data.parcelaId]
    );

    const cultivo = new Cultivo(result.rows[0]);
    await publishEvent("cultivo.created", { cultivoId: cultivo.getId(), tipoCultivo: data.tipoCultivo });

    return cultivo;
  }

  async listByPropietario(propietarioId: number): Promise<Cultivo[]> {
    const result = await pool.query(
      `SELECT c.* FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       WHERE f.propietario_id = $1
       ORDER BY c.created_at DESC`,
      [propietarioId]
    );
    return result.rows.map((row) => new Cultivo(row));
  }

  async listByOperario(operarioId: number): Promise<Cultivo[]> {
    const result = await pool.query(
      `SELECT c.* FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN asignacion_operarios ao ON p.id = ao.parcela_id
       WHERE ao.operario_id = $1
       ORDER BY c.created_at DESC`,
      [operarioId]
    );
    return result.rows.map((row) => new Cultivo(row));
  }

  async searchByTipo(propietarioId: number, tipoCultivo: string): Promise<Cultivo[]> {
    const result = await pool.query(
      `SELECT c.* FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       WHERE f.propietario_id = $1 AND LOWER(c.tipo_cultivo) LIKE LOWER($2)
       ORDER BY c.created_at DESC`,
      [propietarioId, `%${tipoCultivo}%`]
    );
    return result.rows.map((row) => new Cultivo(row));
  }

  async update(id: number, propietarioId: number, data: Partial<{
    tipoCultivo: string;
    fechaSiembra: string;
    estado: EstadoCultivo;
    observaciones: string;
  }>): Promise<Cultivo | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tipoCultivo) { updates.push(`tipo_cultivo = $${idx++}`); values.push(data.tipoCultivo); }
    if (data.fechaSiembra) { updates.push(`fecha_siembra = $${idx++}`); values.push(data.fechaSiembra); }
    if (data.estado) { updates.push(`estado = $${idx++}`); values.push(data.estado); }
    if (data.observaciones !== undefined) { updates.push(`observaciones = $${idx++}`); values.push(data.observaciones); }

    if (updates.length === 0) return null;

    values.push(id, propietarioId);
    const result = await pool.query(
      `UPDATE cultivos c SET ${updates.join(", ")}, updated_at = NOW()
       FROM parcelas p, fincas f
       WHERE c.id = $${idx} AND c.parcela_id = p.id AND p.finca_id = f.id AND f.propietario_id = $${idx + 1}
       RETURNING c.*`,
      values
    );
    return result.rows[0] ? new Cultivo(result.rows[0]) : null;
  }

  async delete(id: number, propietarioId: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM cultivos c
       USING parcelas p, fincas f
       WHERE c.id = $1 AND c.parcela_id = p.id AND p.finca_id = f.id AND f.propietario_id = $2
       RETURNING c.id`,
      [id, propietarioId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getParcelaInfo(cultivoId: number): Promise<{ parcelaId: number; propietarioId: number } | null> {
    const result = await pool.query(
      `SELECT p.id as parcela_id, f.propietario_id
       FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       WHERE c.id = $1`,
      [cultivoId]
    );
    return result.rows[0] || null;
  }
}