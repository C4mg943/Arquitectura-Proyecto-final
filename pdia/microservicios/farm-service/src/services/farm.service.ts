import { pool } from "../config/db.js";
import { Finca, Parcela } from "../models/farm.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class FarmService {
  async createFinca(propietarioId: number, data: {
    nombre: string;
    ubicacion: string;
    descripcion?: string;
    area: number;
    tipoFinca: string;
    codigoIcaInvima?: string;
  }): Promise<Finca> {
    const result = await pool.query(
      `INSERT INTO fincas (nombre, ubicacion, descripcion, area, tipo_finca, propietario_id, codigo_ica_invima)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.nombre, data.ubicacion, data.descripcion || null, data.area, data.tipoFinca, propietarioId, data.codigoIcaInvima || null]
    );
    return new Finca(result.rows[0]);
  }

  async listFincas(propietarioId: number): Promise<Finca[]> {
    const result = await pool.query(
      "SELECT * FROM fincas WHERE propietario_id = $1 ORDER BY created_at DESC",
      [propietarioId]
    );
    return result.rows.map((row) => new Finca(row));
  }

  async deleteFinca(fincaId: number, propietarioId: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM fincas WHERE id = $1 AND propietario_id = $2 RETURNING id",
      [fincaId, propietarioId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createParcela(propietarioId: number, data: {
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
    fincaId: number;
  }): Promise<Parcela> {
    const fincaResult = await pool.query(
      "SELECT id FROM fincas WHERE id = $1 AND propietario_id = $2",
      [data.fincaId, propietarioId]
    );
    if (fincaResult.rows.length === 0) {
      throw new Error("La Finca no existe o no pertenece al productor");
    }

    const result = await pool.query(
      `INSERT INTO parcelas (nombre, municipio, hectareas, latitud, longitud, finca_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.nombre, data.municipio, data.hectareas, data.latitud, data.longitud, data.fincaId]
    );

    await publishEvent("parcela.created", { parcelaId: result.rows[0].id });

    return new Parcela(result.rows[0]);
  }

  async listParcelas(propietarioId: number): Promise<Parcela[]> {
    const result = await pool.query(
      `SELECT p.* FROM parcelas p
       JOIN fincas f ON p.finca_id = f.id
       WHERE f.propietario_id = $1
       ORDER BY p.created_at DESC`,
      [propietarioId]
    );
    return result.rows.map((row) => new Parcela(row));
  }

  async listParcelasByOperario(operarioId: number): Promise<Parcela[]> {
    const result = await pool.query(
      `SELECT p.* FROM parcelas p
       JOIN asignacion_operarios ao ON p.id = ao.parcela_id
       WHERE ao.operario_id = $1`,
      [operarioId]
    );
    return result.rows.map((row) => new Parcela(row));
  }

  async updateParcela(parcelaId: number, propietarioId: number, data: Partial<{
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
  }>): Promise<Parcela | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombre) {
      updates.push(`nombre = $${idx++}`);
      values.push(data.nombre);
    }
    if (data.municipio) {
      updates.push(`municipio = $${idx++}`);
      values.push(data.municipio);
    }
    if (data.hectareas) {
      updates.push(`hectareas = $${idx++}`);
      values.push(data.hectareas);
    }
    if (data.latitud) {
      updates.push(`latitud = $${idx++}`);
      values.push(data.latitud);
    }
    if (data.longitud) {
      updates.push(`longitud = $${idx++}`);
      values.push(data.longitud);
    }

    if (updates.length === 0) return null;

    values.push(parcelaId, propietarioId);
    const result = await pool.query(
      `UPDATE parcelas SET ${updates.join(", ")}, updated_at = NOW() 
       WHERE id = $${idx} AND finca_id IN (SELECT id FROM fincas WHERE propietario_id = $${idx + 1})
       RETURNING *`,
      values
    );
    return result.rows[0] ? new Parcela(result.rows[0]) : null;
  }

  async deleteParcela(parcelaId: number, propietarioId: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM parcelas p WHERE p.id = $1 
       AND p.finca_id IN (SELECT id FROM fincas WHERE propietario_id = $2) RETURNING id`,
      [parcelaId, propietarioId]
    );
return (result.rowCount ?? 0) > 0;
  }
}