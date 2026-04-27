import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { publishEvent } from "../config/rabbitmq.js";

export class OperarioService {
  async registerOperario(
    propietarioId: number,
    data: { nombre: string; identificacion: string; email: string; password: string }
  ) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await pool.query(
      `INSERT INTO users (nombre, identificacion, email, password_hash, rol, productor_id)
       VALUES ($1, $2, $3, $4, 'OPERARIO', $5) RETURNING id, nombre, identificacion, email, rol`,
      [data.nombre, data.identificacion, data.email, passwordHash, propietarioId]
    );

    await publishEvent("operario.registered", { userId: result.rows[0].id, propietarioId });

    return result.rows[0];
  }

  async listOperarios(propietarioId: number) {
    const result = await pool.query(
      `SELECT id, nombre, identificacion, email, rol FROM users
       WHERE productor_id = $1 AND rol = 'OPERARIO'`,
      [propietarioId]
    );
    return result.rows;
  }

  async listOperariosConParcelas(propietarioId: number) {
    const operarios = await pool.query(
      `SELECT id, nombre, identificacion, email, rol FROM users
       WHERE productor_id = $1 AND rol = 'OPERARIO'`,
      [propietarioId]
    );

    const parcelas = await pool.query(
      `SELECT p.id, p.nombre, p.municipio, p.hectareas, p.finca_id, ao.operario_id
       FROM parcelas p
       JOIN asignacion_operarios ao ON p.id = ao.parcela_id
       JOIN fincas f ON p.finca_id = f.id
       WHERE f.propietario_id = $1`,
      [propietarioId]
    );

    const parcelasByOperario = new Map<number, any[]>();
    parcelas.rows.forEach((parcela: any) => {
      const list = parcelasByOperario.get(parcela.operario_id) || [];
      list.push({
        id: parcela.id,
        nombre: parcela.nombre,
        municipio: parcela.municipio,
        hectareas: parcela.hectareas,
        fincaId: parcela.finca_id,
      });
      parcelasByOperario.set(parcela.operario_id, list);
    });

    return operarios.rows.map((op: any) => ({
      operario: op,
      parcelas: parcelasByOperario.get(op.id) || [],
    }));
  }

  async asignarAParcela(propietarioId: number, operarioId: number, parcelaId: number) {
    const parcelaCheck = await pool.query(
      `SELECT p.id FROM parcelas p
       JOIN fincas f ON p.finca_id = f.id
       WHERE p.id = $1 AND f.propietario_id = $2`,
      [parcelaId, propietarioId]
    );

    if (parcelaCheck.rows.length === 0) {
      throw new Error("La parcela no existe o no pertenece al productor");
    }

    const operarioCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND productor_id = $2",
      [operarioId, propietarioId]
    );

    if (operarioCheck.rows.length === 0) {
      throw new Error("El operario no existe o no pertenece al productor");
    }

    await pool.query(
      `INSERT INTO asignacion_operarios (operario_id, parcela_id, asignado_por_id)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [operarioId, parcelaId, propietarioId]
    );

    await publishEvent("operario.asignado", { operarioId, parcelaId });

    return { success: true };
  }

  async desasignarDeParcela(propietarioId: number, operarioId: number, parcelaId: number) {
    const result = await pool.query(
      `DELETE FROM asignacion_operarios ao
       USING parcelas p, fincas f
       WHERE ao.parcela_id = p.id AND p.finca_id = f.id
       AND ao.operario_id = $1 AND ao.parcela_id = $2 AND f.propietario_id = $3
       RETURNING ao.id`,
      [operarioId, parcelaId, propietarioId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new Error("La asignación no existe");
    }

    return { success: true };
  }
}