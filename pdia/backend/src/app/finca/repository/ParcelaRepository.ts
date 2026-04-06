import pool from "../../../config/connection/dbConnetions";
import { Parcela, ParcelaPersistence } from "../model/Parcela";
import { CreateParcelaDto, UpdateParcelaDto } from "../model/dto/ParcelaDto";

interface ParcelaRow {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: string | number;
    latitud: string | number;
    longitud: string | number;
    fincaId: number;
    createdAt: string;
    updatedAt: string;
}

interface ParcelaConPropietarioRow extends ParcelaRow {
    propietarioId: number;
}

export class ParcelaRepository {
    private map(row: ParcelaRow): Parcela {
        const data: ParcelaPersistence = {
            id: row.id,
            nombre: row.nombre,
            municipio: row.municipio,
            hectareas: Number(row.hectareas),
            latitud: Number(row.latitud),
            longitud: Number(row.longitud),
            fincaId: row.fincaId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
        return new Parcela(data);
    }

    public async create(payload: CreateParcelaDto): Promise<Parcela> {
        const query = `
            INSERT INTO parcelas (
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                finca_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                finca_id AS "fincaId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;

        const row = await pool.one<ParcelaRow>(query, [
            payload.nombre,
            payload.municipio,
            payload.hectareas,
            payload.latitud,
            payload.longitud,
            payload.fincaId
        ]);
        return this.map(row);
    }

    public async listByPropietario(propietarioId: number): Promise<Parcela[]> {
        const query = `
            SELECT
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.latitud,
                p.longitud,
                p.finca_id AS "fincaId",
                p.created_at AS "createdAt",
                p.updated_at AS "updatedAt"
            FROM parcelas p
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE f.propietario_id = $1
            ORDER BY p.id DESC;
        `;
        const rows = await pool.manyOrNone<ParcelaRow>(query, [propietarioId]);
        return rows.map((row) => this.map(row));
    }

    public async listByOperario(operarioId: number): Promise<Parcela[]> {
        const query = `
            SELECT
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.latitud,
                p.longitud,
                p.finca_id AS "fincaId",
                p.created_at AS "createdAt",
                p.updated_at AS "updatedAt"
            FROM asignacion_operarios ao
            INNER JOIN parcelas p ON p.id = ao.parcela_id
            WHERE ao.operario_id = $1
            ORDER BY p.id DESC;
        `;
        const rows = await pool.manyOrNone<ParcelaRow>(query, [operarioId]);
        return rows.map((row) => this.map(row));
    }

    public async findByIdAndPropietario(id: number, propietarioId: number): Promise<Parcela | null> {
        const query = `
            SELECT
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.latitud,
                p.longitud,
                p.finca_id AS "fincaId",
                p.created_at AS "createdAt",
                p.updated_at AS "updatedAt"
            FROM parcelas p
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE p.id = $1
              AND f.propietario_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<ParcelaRow>(query, [id, propietarioId]);
        return row ? this.map(row) : null;
    }

    public async findByIdAndOperario(id: number, operarioId: number): Promise<Parcela | null> {
        const query = `
            SELECT
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.latitud,
                p.longitud,
                p.finca_id AS "fincaId",
                p.created_at AS "createdAt",
                p.updated_at AS "updatedAt"
            FROM parcelas p
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE p.id = $1
              AND ao.operario_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<ParcelaRow>(query, [id, operarioId]);
        return row ? this.map(row) : null;
    }

    public async findById(id: number): Promise<Parcela | null> {
        const query = `
            SELECT
                id,
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                finca_id AS "fincaId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM parcelas
            WHERE id = $1
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<ParcelaRow>(query, [id]);
        return row ? this.map(row) : null;
    }

    public async findByIdWithPropietario(id: number): Promise<{ parcela: Parcela; propietarioId: number; } | null> {
        const query = `
            SELECT
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.latitud,
                p.longitud,
                p.finca_id AS "fincaId",
                p.created_at AS "createdAt",
                p.updated_at AS "updatedAt",
                f.propietario_id AS "propietarioId"
            FROM parcelas p
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE p.id = $1
            LIMIT 1;
        `;

        const row = await pool.oneOrNone<ParcelaConPropietarioRow>(query, [id]);
        if (!row) {
            return null;
        }

        return {
            parcela: this.map(row),
            propietarioId: row.propietarioId
        };
    }

    public async updateByPropietario(id: number, propietarioId: number, payload: UpdateParcelaDto): Promise<Parcela | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, propietarioId];

        if (payload.nombre !== undefined) {
            fields.push(`nombre = $${values.length + 1}`);
            values.push(payload.nombre);
        }
        if (payload.municipio !== undefined) {
            fields.push(`municipio = $${values.length + 1}`);
            values.push(payload.municipio);
        }
        if (payload.hectareas !== undefined) {
            fields.push(`hectareas = $${values.length + 1}`);
            values.push(payload.hectareas);
        }
        if (payload.latitud !== undefined) {
            fields.push(`latitud = $${values.length + 1}`);
            values.push(payload.latitud);
        }
        if (payload.longitud !== undefined) {
            fields.push(`longitud = $${values.length + 1}`);
            values.push(payload.longitud);
        }
        if (payload.fincaId !== undefined) {
            fields.push(`finca_id = $${values.length + 1}`);
            values.push(payload.fincaId);
        }

        if (fields.length === 0) {
            return this.findByIdAndPropietario(id, propietarioId);
        }

        const query = `
            UPDATE parcelas p
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM fincas f
            WHERE p.id = $1
              AND f.id = p.finca_id
              AND f.propietario_id = $2
            RETURNING
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.latitud,
                p.longitud,
                p.finca_id AS "fincaId",
                p.created_at AS "createdAt",
                p.updated_at AS "updatedAt";
        `;
        const row = await pool.oneOrNone<ParcelaRow>(query, values);
        return row ? this.map(row) : null;
    }

    public async deleteByPropietario(id: number, propietarioId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM parcelas p
            USING fincas f
            WHERE p.id = $1
              AND f.id = p.finca_id
              AND f.propietario_id = $2
            `,
            [id, propietarioId]
        );
        return result.rowCount > 0;
    }

    public async fincaBelongsToPropietario(fincaId: number, propietarioId: number): Promise<boolean> {
        const row = await pool.oneOrNone<{ id: number }>(
            "SELECT id FROM fincas WHERE id = $1 AND propietario_id = $2 LIMIT 1",
            [fincaId, propietarioId]
        );
        return Boolean(row);
    }
}
