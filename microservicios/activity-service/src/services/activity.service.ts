import { pool } from "../config/db.js";
import { Actividad, TipoActividad } from "../models/activity.model.js";
import { publishEvent } from "../config/rabbitmq.js";

/**
 * Normaliza una fecha (ISO "YYYY-MM-DD" o ISO completa) a objeto Date UTC a medianoche.
 * Usamos UTC para evitar desfases por zona horaria al comparar solo día.
 */
function toDateOnlyUTC(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const str = value.includes("T") ? value.split("T")[0] : value;
  const [y, m, d] = str.split("-").map((p) => parseInt(p, 10));
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Valida la fecha de una actividad:
 * - No puede ser futura respecto al día actual (UTC).
 * - No puede ser anterior a la fecha de siembra del cultivo asociado.
 * Lanza Error con un mensaje legible si algo no cuadra.
 */
async function validateActivityDate(fecha: string, cultivoId: number): Promise<void> {
  const fechaActividad = toDateOnlyUTC(fecha);
  const today = todayUTC();

  if (fechaActividad.getTime() > today.getTime()) {
    throw new Error("La fecha de la actividad no puede ser futura.");
  }

  const result = await pool.query(
    "SELECT fecha_siembra FROM cultivos WHERE id = $1",
    [cultivoId],
  );
  if (result.rows.length === 0) {
    throw new Error("El cultivo no existe.");
  }

  const fechaSiembra = toDateOnlyUTC(result.rows[0].fecha_siembra as Date | string);
  if (fechaActividad.getTime() < fechaSiembra.getTime()) {
    const siembraStr = fechaSiembra.toISOString().split("T")[0];
    throw new Error(
      `La fecha de la actividad no puede ser anterior a la fecha de siembra del cultivo (${siembraStr}).`,
    );
  }
}

export class ActivityService {
  async create(data: {
    tipo: TipoActividad;
    fecha: string;
    descripcion: string;
    datos?: object;
    cultivoId: number;
    usuarioId: number;
  }): Promise<Actividad> {
    await validateActivityDate(data.fecha, data.cultivoId);

    const result = await pool.query(
      `INSERT INTO actividades (tipo, fecha, descripcion, datos, cultivo_id, creado_por_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.tipo, data.fecha, data.descripcion, data.datos || null, data.cultivoId, data.usuarioId]
    );

    const actividad = new Actividad(result.rows[0]);
    await publishEvent("actividad.created", {
      actividadId: actividad.getId(),
      tipo: actividad.getTipo(),
      cultivoId: actividad.getCultivoId(),
      usuarioId: data.usuarioId,
    });

    return actividad;
  }

  async listByCultivo(cultivoId: number, usuarioId: number, rol: string): Promise<Actividad[]> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a WHERE a.cultivo_id = $1 ORDER BY a.fecha DESC, a.created_at DESC`,
        [cultivoId]
      );
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE a.cultivo_id = $1 AND f.propietario_id = $2
         ORDER BY a.fecha DESC, a.created_at DESC`,
        [cultivoId, usuarioId]
      );
    } else if (rol === "TECNICO") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
         WHERE a.cultivo_id = $1 AND at.tecnico_id = $2
         ORDER BY a.fecha DESC, a.created_at DESC`,
        [cultivoId, usuarioId]
      );
    } else {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE a.cultivo_id = $1 AND ao.operario_id = $2
         ORDER BY a.fecha DESC, a.created_at DESC`,
        [cultivoId, usuarioId]
      );
    }
    return result.rows.map((row) => new Actividad(row));
  }

  async listByUsuario(usuarioId: number, rol: string): Promise<Actividad[]> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query(
        `SELECT * FROM actividades ORDER BY fecha DESC`
      );
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE f.propietario_id = $1
         ORDER BY a.fecha DESC`,
        [usuarioId]
      );
    } else if (rol === "TECNICO") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
         WHERE at.tecnico_id = $1
         ORDER BY a.fecha DESC`,
        [usuarioId]
      );
    } else {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE ao.operario_id = $1
         ORDER BY a.fecha DESC`,
        [usuarioId]
      );
    }
    return result.rows.map((row) => new Actividad(row));
  }

  async filterByTipo(usuarioId: number, rol: string, tipo: TipoActividad): Promise<Actividad[]> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query(
        `SELECT * FROM actividades WHERE tipo = $1 ORDER BY fecha DESC`,
        [tipo]
      );
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE f.propietario_id = $1 AND a.tipo = $2
         ORDER BY a.fecha DESC`,
        [usuarioId, tipo]
      );
    } else if (rol === "TECNICO") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
         WHERE at.tecnico_id = $1 AND a.tipo = $2
         ORDER BY a.fecha DESC`,
        [usuarioId, tipo]
      );
    } else {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE ao.operario_id = $1 AND a.tipo = $2
         ORDER BY a.fecha DESC`,
        [usuarioId, tipo]
      );
    }
    return result.rows.map((row) => new Actividad(row));
  }

  async findById(id: number, usuarioId: number, rol: string): Promise<Actividad | null> {
    let result;
    if (rol === "ADMINISTRADOR") {
      result = await pool.query("SELECT * FROM actividades WHERE id = $1", [id]);
    } else if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE a.id = $1 AND f.propietario_id = $2`,
        [id, usuarioId]
      );
    } else if (rol === "TECNICO") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
         WHERE a.id = $1 AND at.tecnico_id = $2`,
        [id, usuarioId]
      );
    } else {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN asignacion_operarios ao ON p.id = ao.parcela_id
         WHERE a.id = $1 AND ao.operario_id = $2`,
        [id, usuarioId]
      );
    }
    return result.rows[0] ? new Actividad(result.rows[0]) : null;
  }

  async update(
    id: number,
    usuarioId: number,
    rol: string,
    data: Partial<{
      tipo: TipoActividad;
      fecha: string;
      descripcion: string;
      datos: object;
    }>
  ): Promise<Actividad | null> {
    // Verificar ownership antes de actualizar
    const existing = await this.findById(id, usuarioId, rol);
    if (!existing) return null;

    // Operario solo puede editar actividades que él creó
    if (rol === "OPERARIO" && existing.getCreadoPorId() !== usuarioId) {
      throw new Error("No tienes permiso para editar esta actividad");
    }

    // Si se está cambiando la fecha, validar que no sea futura ni anterior a la siembra
    if (data.fecha !== undefined) {
      await validateActivityDate(data.fecha, existing.getCultivoId());
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.tipo !== undefined) { updates.push(`tipo = $${idx++}`); values.push(data.tipo); }
    if (data.fecha !== undefined) { updates.push(`fecha = $${idx++}`); values.push(data.fecha); }
    if (data.descripcion !== undefined) { updates.push(`descripcion = $${idx++}`); values.push(data.descripcion); }
    if (data.datos !== undefined) { updates.push(`datos = $${idx++}`); values.push(data.datos); }

    if (updates.length === 0) return existing;

    values.push(id);
    const result = await pool.query(
      `UPDATE actividades SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ? new Actividad(result.rows[0]) : null;
  }

  async delete(id: number, usuarioId: number, rol: string): Promise<boolean> {
    let result;
    if (rol === "PRODUCTOR") {
      result = await pool.query(
        `DELETE FROM actividades a
         USING cultivos c, parcelas p, fincas f
         WHERE a.id = $1 AND a.cultivo_id = c.id AND c.parcela_id = p.id AND p.finca_id = f.id
         AND f.propietario_id = $2 RETURNING a.id`,
        [id, usuarioId]
      );
    } else {
      result = await pool.query(
        `DELETE FROM actividades a
         USING cultivos c, parcelas p, asignacion_operarios ao
         WHERE a.id = $1 AND a.cultivo_id = c.id AND c.parcela_id = p.id AND p.id = ao.parcela_id
         AND ao.operario_id = $2 RETURNING a.id`,
        [id, usuarioId]
      );
    }
    return (result.rowCount ?? 0) > 0;
  }
}