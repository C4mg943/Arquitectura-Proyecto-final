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
    rol: string;
  }): Promise<Cultivo> {
    // La fecha de siembra no puede ser futura.
    const siembra = new Date(data.fechaSiembra.includes("T") ? data.fechaSiembra : `${data.fechaSiembra}T00:00:00Z`);
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const siembraUtc = new Date(Date.UTC(siembra.getUTCFullYear(), siembra.getUTCMonth(), siembra.getUTCDate()));
    if (siembraUtc.getTime() > todayUtc.getTime()) {
      throw new Error("La fecha de siembra no puede ser futura.");
    }

    // Validar ownership: productor sobre sus fincas, operario sobre sus parcelas asignadas.
    const ownership = data.rol === "OPERARIO"
      ? await pool.query(
          `SELECT 1 FROM parcelas p
           JOIN asignacion_operarios ao ON p.id = ao.parcela_id
           WHERE p.id = $1 AND ao.operario_id = $2`,
          [data.parcelaId, data.usuarioId]
        )
      : await pool.query(
          `SELECT 1 FROM parcelas p
           JOIN fincas f ON p.finca_id = f.id
           WHERE p.id = $1 AND f.propietario_id = $2`,
          [data.parcelaId, data.usuarioId]
        );
    if (ownership.rowCount === 0) {
      throw new Error(
        data.rol === "OPERARIO"
          ? "La parcela no existe o no te fue asignada."
          : "La parcela no existe o no pertenece al productor."
      );
    }

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

  async listAll(): Promise<Cultivo[]> {
    const result = await pool.query(
      "SELECT * FROM cultivos ORDER BY created_at DESC"
    );
    return result.rows.map((row) => new Cultivo(row));
  }

  async listByTecnico(tecnicoId: number): Promise<Cultivo[]> {
    const result = await pool.query(
      `SELECT c.* FROM cultivos c
       JOIN parcelas p ON c.parcela_id = p.id
       JOIN fincas f ON p.finca_id = f.id
       JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
       WHERE at.tecnico_id = $1
       ORDER BY c.created_at DESC`,
      [tecnicoId]
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

  async update(id: number, userId: number, rol: string, data: Partial<{
    tipoCultivo: string;
    fechaSiembra: string;
    estado: EstadoCultivo;
    observaciones: string;
  }>): Promise<Cultivo | null> {
    // Chequeo de ownership: el operario solo puede editar cultivos de parcelas que le fueron asignadas.
    const existing = await this.findById(id, userId, rol);
    if (!existing) return null;

    // Validar fecha de siembra si la están cambiando
    if (data.fechaSiembra) {
      const siembra = new Date(data.fechaSiembra.includes("T") ? data.fechaSiembra : `${data.fechaSiembra}T00:00:00Z`);
      const today = new Date();
      const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const siembraUtc = new Date(Date.UTC(siembra.getUTCFullYear(), siembra.getUTCMonth(), siembra.getUTCDate()));
      if (siembraUtc.getTime() > todayUtc.getTime()) {
        throw new Error("La fecha de siembra no puede ser futura.");
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tipoCultivo) { updates.push(`tipo_cultivo = $${idx++}`); values.push(data.tipoCultivo); }
    if (data.fechaSiembra) { updates.push(`fecha_siembra = $${idx++}`); values.push(data.fechaSiembra); }
    if (data.estado) { updates.push(`estado = $${idx++}`); values.push(data.estado); }
    if (data.observaciones !== undefined) { updates.push(`observaciones = $${idx++}`); values.push(data.observaciones); }

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE cultivos SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ? new Cultivo(result.rows[0]) : null;
  }

  async delete(id: number, userId: number, rol: string): Promise<boolean> {
    // Delegamos el chequeo de ownership a findById, que ya cubre los 4 roles.
    const existing = await this.findById(id, userId, rol);
    if (!existing) return false;

    const result = await pool.query(
      `DELETE FROM cultivos WHERE id = $1 RETURNING id`,
      [id]
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

  async getTiposCultivo(): Promise<{ id: number; nombre: string; descripcion: string | null }[]> {
    const result = await pool.query(
      "SELECT id, nombre, descripcion FROM tipos_cultivo ORDER BY nombre"
    );
    return result.rows;
  }

  async findById(id: number, userId: number, rol: string): Promise<Cultivo | null> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query("SELECT * FROM cultivos WHERE id = $1", [id]);
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT c.* FROM cultivos c
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE c.id = $1 AND f.propietario_id = $2`,
        [id, userId]
      );
    } else if (rol === "TECNICO") {
      result = await pool.query(
        `SELECT c.* FROM cultivos c
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
         WHERE c.id = $1 AND at.tecnico_id = $2`,
        [id, userId]
      );
    } else {
      result = await pool.query(
        `SELECT c.* FROM cultivos c
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE c.id = $1 AND ao.operario_id = $2`,
        [id, userId]
      );
    }
    return result.rows[0] ? new Cultivo(result.rows[0]) : null;
  }
}