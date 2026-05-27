import { pool } from "../config/db.js";
import { Cultivo, EstadoCultivo } from "../models/crop.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class CropService {
  /**
   * Verifica que la suma de area_m2 de los cultivos en una parcela no supere
   * el área total de la parcela (hectareas * 10 000). excludeCultivoId permite
   * excluir un cultivo durante un update.
   */
  private async validateAreaCultivos(
    parcelaId: number,
    areaM2Nueva: number,
    excludeCultivoId?: number
  ): Promise<void> {
    if (!areaM2Nueva || areaM2Nueva <= 0) return; // permitido sin área (legacy)
    const parcelaRes = await pool.query(
      `SELECT nombre, hectareas::float AS hectareas FROM parcelas WHERE id = $1`,
      [parcelaId]
    );
    if (parcelaRes.rows.length === 0) {
      throw new Error("La parcela indicada no existe");
    }
    const parcela = parcelaRes.rows[0] as { nombre: string; hectareas: number };
    const totalM2 = Number(parcela.hectareas) * 10000;

    const sumQuery = excludeCultivoId
      ? `SELECT COALESCE(SUM(area_m2)::float, 0) AS suma FROM cultivos WHERE parcela_id = $1 AND id <> $2`
      : `SELECT COALESCE(SUM(area_m2)::float, 0) AS suma FROM cultivos WHERE parcela_id = $1`;
    const params = excludeCultivoId ? [parcelaId, excludeCultivoId] : [parcelaId];
    const sumRes = await pool.query(sumQuery, params);
    const ocupado = Number(sumRes.rows[0].suma);
    const disponible = totalM2 - ocupado;

    if (areaM2Nueva > disponible + 0.01) {
      throw new Error(
        `El cultivo no cabe en la parcela "${parcela.nombre}". ` +
          `Área total: ${totalM2.toFixed(0)} m² (${parcela.hectareas} ha), ` +
          `ocupada por otros cultivos: ${ocupado.toFixed(0)} m², ` +
          `disponible: ${disponible.toFixed(0)} m². Estás intentando registrar ${areaM2Nueva.toFixed(0)} m².`
      );
    }
  }

  async create(data: {
    tipoCultivo: string;
    fechaSiembra: string;
    estado: EstadoCultivo;
    observaciones?: string;
    areaM2?: number;
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

    // Validar que el cultivo quepa en el área disponible de la parcela
    const areaM2 = data.areaM2 ?? 0;
    await this.validateAreaCultivos(data.parcelaId, areaM2);

    const result = await pool.query(
      `INSERT INTO cultivos (tipo_cultivo, fecha_siembra, estado, observaciones, area_m2, parcela_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.tipoCultivo, data.fechaSiembra, data.estado, data.observaciones || null, areaM2, data.parcelaId]
    );

    const cultivo = new Cultivo(result.rows[0]);

    // Obtener propietario para enriquecer el evento
    const propietarioRes = await pool.query(
      `SELECT f.propietario_id FROM fincas f JOIN parcelas p ON f.id = p.finca_id WHERE p.id = $1`,
      [data.parcelaId]
    );
    const propietarioId = propietarioRes.rows[0]?.propietario_id ?? null;

    await publishEvent("cultivo.created", {
      cultivoId: cultivo.getId(),
      tipoCultivo: data.tipoCultivo,
      parcelaId: data.parcelaId,
      propietarioId,
      creadoPorId: data.usuarioId,
      creadoPorRol: data.rol,
    });

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
    areaM2: number;
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

    // Validar área si la están cambiando
    if (data.areaM2 !== undefined) {
      await this.validateAreaCultivos(existing.getParcelaId(), data.areaM2, id);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tipoCultivo) { updates.push(`tipo_cultivo = $${idx++}`); values.push(data.tipoCultivo); }
    if (data.fechaSiembra) { updates.push(`fecha_siembra = $${idx++}`); values.push(data.fechaSiembra); }
    if (data.estado) { updates.push(`estado = $${idx++}`); values.push(data.estado); }
    if (data.observaciones !== undefined) { updates.push(`observaciones = $${idx++}`); values.push(data.observaciones); }
    if (data.areaM2 !== undefined) { updates.push(`area_m2 = $${idx++}`); values.push(data.areaM2); }

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE cultivos SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    const updated = result.rows[0] ? new Cultivo(result.rows[0]) : null;

    if (updated) {
      // Publicar evento de actualización con info enriquecida
      const propietarioRes = await pool.query(
        `SELECT f.propietario_id FROM fincas f
         JOIN parcelas p ON f.id = p.finca_id
         JOIN cultivos c ON p.id = c.parcela_id
         WHERE c.id = $1`,
        [id]
      );
      const propietarioId = propietarioRes.rows[0]?.propietario_id ?? null;

      await publishEvent("cultivo.updated", {
        cultivoId: updated.getId(),
        tipoCultivo: updated.getTipoCultivo(),
        estado: updated.getEstado(),
        parcelaId: updated.getParcelaId(),
        propietarioId,
        actualizadoPorId: userId,
        actualizadoPorRol: rol,
        cambios: data,
      });
    }

    return updated;
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