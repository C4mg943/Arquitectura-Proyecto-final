import { pool } from "../config/db.js";
import { Actividad, TipoActividad } from "../models/activity.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export class ActivityService {
  async create(data: {
    tipo: TipoActividad;
    fecha: string;
    descripcion: string;
    datos?: object;
    cultivoId: number;
    usuarioId: number;
  }): Promise<Actividad> {
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
    if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE a.cultivo_id = $1 AND f.propietario_id = $2
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
    if (rol === "PRODUCTOR") {
      result = await pool.query(
        `SELECT a.* FROM actividades a
         JOIN cultivos c ON a.cultivo_id = c.id
         JOIN parcelas p ON c.parcela_id = p.id
         JOIN fincas f ON p.finca_id = f.id
         WHERE a.creado_por_id = $1 AND f.propietario_id = $1
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
    const actividades = await this.listByUsuario(usuarioId, rol);
    return actividades.filter((a) => a.getTipo() === tipo);
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