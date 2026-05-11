import { pool } from "../config/db.js";
import { Finca, Parcela } from "../models/farm.model.js";
import { publishEvent } from "../config/rabbitmq.js";

/**
 * Distancia haversine entre dos puntos en kilómetros.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio medio de la Tierra en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface MunicipioRow {
  nombre: string;
  departamento: string;
  latitud: number;
  longitud: number;
  radio_km: number;
}

/**
 * Busca un municipio por nombre (case-insensitive). Si hay varios con el mismo
 * nombre (caso ambiguo), se intenta desambiguar por cercanía a las coords dadas.
 * Devuelve null si no existe en el catálogo.
 */
async function findMunicipio(
  nombre: string,
  latitud: number,
  longitud: number,
): Promise<MunicipioRow | null> {
  const result = await pool.query(
    `SELECT nombre, departamento, latitud::float AS latitud, longitud::float AS longitud, radio_km::float AS radio_km
     FROM municipios WHERE LOWER(nombre) = LOWER($1)`,
    [nombre.trim()],
  );
  if (result.rows.length === 0) return null;
  if (result.rows.length === 1) return result.rows[0] as MunicipioRow;

  // Varios municipios con el mismo nombre — elegir el más cercano al punto dado
  return (result.rows as MunicipioRow[]).reduce((closest, current) => {
    const dCurrent = haversineKm(latitud, longitud, current.latitud, current.longitud);
    const dClosest = haversineKm(latitud, longitud, closest.latitud, closest.longitud);
    return dCurrent < dClosest ? current : closest;
  });
}

/**
 * Valida que las coordenadas dadas estén dentro del radio del municipio declarado.
 * - Si el municipio no existe en el catálogo, se acepta (no bloqueamos nombres libres).
 * - Si existe y las coords están fuera de su radio, lanza un Error.
 */
async function validateCoordsForMunicipio(
  municipio: string,
  latitud: number,
  longitud: number,
): Promise<void> {
  // Validar rangos básicos
  if (latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
    throw new Error("Latitud o longitud fuera de rango válido");
  }

  const match = await findMunicipio(municipio, latitud, longitud);
  if (!match) {
    // No bloqueamos municipios no catalogados, solo los validamos en rango.
    return;
  }

  const distance = haversineKm(latitud, longitud, match.latitud, match.longitud);
  if (distance > match.radio_km) {
    throw new Error(
      `Las coordenadas (${latitud.toFixed(4)}, ${longitud.toFixed(4)}) no coinciden con ${match.nombre}, ${match.departamento}. ` +
        `Distancia: ${distance.toFixed(1)} km (máximo permitido: ${match.radio_km} km).`,
    );
  }
}

export class FarmService {
  async createFinca(propietarioId: number | null, data: {
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

  async listAllFincas(): Promise<Finca[]> {
    const result = await pool.query(
      "SELECT * FROM fincas ORDER BY created_at DESC"
    );
    return result.rows.map((row) => new Finca(row));
  }

  async listFincasByOperario(operarioId: number): Promise<Finca[]> {
    const result = await pool.query(
      `SELECT DISTINCT f.* FROM fincas f
       JOIN parcelas p ON p.finca_id = f.id
       JOIN asignacion_operarios ao ON ao.parcela_id = p.id
       WHERE ao.operario_id = $1
       ORDER BY f.created_at DESC`,
      [operarioId]
    );
    return result.rows.map((row) => new Finca(row));
  }

  async listFincasByTecnico(tecnicoId: number): Promise<Finca[]> {
    const result = await pool.query(
      `SELECT DISTINCT f.* FROM fincas f
       JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
       WHERE at.tecnico_id = $1
       ORDER BY f.created_at DESC`,
      [tecnicoId]
    );
    return result.rows.map((row) => new Finca(row));
  }

  async listAllParcelas(): Promise<Parcela[]> {
    const result = await pool.query(
      "SELECT * FROM parcelas ORDER BY created_at DESC"
    );
    return result.rows.map((row) => new Parcela(row));
  }

  async listParcelasByTecnico(tecnicoId: number): Promise<Parcela[]> {
    const result = await pool.query(
      `SELECT p.* FROM parcelas p
       JOIN fincas f ON p.finca_id = f.id
       JOIN asignacion_tecnicos at ON f.propietario_id = at.productor_id
       WHERE at.tecnico_id = $1
       ORDER BY p.created_at DESC`,
      [tecnicoId]
    );
    return result.rows.map((row) => new Parcela(row));
  }

  async deleteFinca(fincaId: number, propietarioId: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM fincas WHERE id = $1 AND propietario_id = $2 RETURNING id",
      [fincaId, propietarioId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findFinca(fincaId: number, propietarioId: number | null): Promise<Finca | null> {
    const result = propietarioId === null
      ? await pool.query("SELECT * FROM fincas WHERE id = $1", [fincaId])
      : await pool.query("SELECT * FROM fincas WHERE id = $1 AND propietario_id = $2", [fincaId, propietarioId]);
    return result.rows[0] ? new Finca(result.rows[0]) : null;
  }

  async updateFinca(
    fincaId: number,
    propietarioId: number | null,
    data: Partial<{
      nombre: string;
      ubicacion: string;
      descripcion: string;
      area: number;
      tipoFinca: string;
      codigoIcaInvima: string;
    }>
  ): Promise<Finca | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.nombre !== undefined) { updates.push(`nombre = $${idx++}`); values.push(data.nombre); }
    if (data.ubicacion !== undefined) { updates.push(`ubicacion = $${idx++}`); values.push(data.ubicacion); }
    if (data.descripcion !== undefined) { updates.push(`descripcion = $${idx++}`); values.push(data.descripcion || null); }
    if (data.area !== undefined) { updates.push(`area = $${idx++}`); values.push(data.area); }
    if (data.tipoFinca !== undefined) { updates.push(`tipo_finca = $${idx++}`); values.push(data.tipoFinca); }
    if (data.codigoIcaInvima !== undefined) { updates.push(`codigo_ica_invima = $${idx++}`); values.push(data.codigoIcaInvima || null); }

    if (updates.length === 0) return this.findFinca(fincaId, propietarioId);

    values.push(fincaId);
    let query: string;
    if (propietarioId === null) {
      query = `UPDATE fincas SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    } else {
      values.push(propietarioId);
      query = `UPDATE fincas SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx} AND propietario_id = $${idx + 1} RETURNING *`;
    }

    const result = await pool.query(query, values);
    return result.rows[0] ? new Finca(result.rows[0]) : null;
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

    // Validar que las coordenadas concuerden con el municipio declarado
    await validateCoordsForMunicipio(data.municipio, data.latitud, data.longitud);

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
    // Si se están cambiando coords o municipio, validar consistencia. Leemos el
    // estado actual para rellenar los campos no enviados.
    if (data.municipio !== undefined || data.latitud !== undefined || data.longitud !== undefined) {
      const current = await pool.query(
        `SELECT p.municipio, p.latitud::float AS latitud, p.longitud::float AS longitud
         FROM parcelas p
         JOIN fincas f ON p.finca_id = f.id
         WHERE p.id = $1 AND f.propietario_id = $2`,
        [parcelaId, propietarioId]
      );
      if (current.rows.length === 0) return null;

      const municipio = data.municipio ?? current.rows[0].municipio;
      const latitud = data.latitud ?? Number(current.rows[0].latitud);
      const longitud = data.longitud ?? Number(current.rows[0].longitud);
      await validateCoordsForMunicipio(municipio, latitud, longitud);
    }

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
    if (data.latitud !== undefined) {
      updates.push(`latitud = $${idx++}`);
      values.push(data.latitud);
    }
    if (data.longitud !== undefined) {
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