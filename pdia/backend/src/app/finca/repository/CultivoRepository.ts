import pool from "../../../config/connection/dbConnetions";
import { Cultivo, CultivoPersistence } from "../model/Cultivo";
import { CreateCultivoDto, UpdateCultivoDto } from "../model/dto/CultivoDto";

interface CultivoRow {
    id: number;
    tipoCultivo: string;
    fechaSiembra: string;
    estado: "EN_CRECIMIENTO" | "COSECHADO" | "AFECTADO";
    observaciones: string | null;
    parcelaId: number;
    createdAt: string;
    updatedAt: string;
}

interface ParcelOwnershipRow {
    id: number;
    propietarioId: number;
}

export class CultivoRepository {
    private map(row: CultivoRow): Cultivo {
        const data: CultivoPersistence = {
            id: row.id,
            tipoCultivo: row.tipoCultivo,
            fechaSiembra: new Date(row.fechaSiembra),
            estado: row.estado,
            observaciones: row.observaciones,
            parcelaId: row.parcelaId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
        return new Cultivo(data);
    }

    public async findParcelaOwnership(parcelaId: number): Promise<{ parcelaId: number; propietarioId: number; } | null> {
        const row = await pool.oneOrNone<ParcelOwnershipRow>(
            `
            SELECT
                p.id,
                f.propietario_id AS "propietarioId"
            FROM parcelas p
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE p.id = $1
            LIMIT 1
            `,
            [parcelaId]
        );
        if (!row) {
            return null;
        }
        return {
            parcelaId: row.id,
            propietarioId: row.propietarioId
        };
    }

    public async parcelaBelongsToOperario(parcelaId: number, operarioId: number): Promise<boolean> {
        const row = await pool.oneOrNone<{ id: number }>(
            `
            SELECT p.id
            FROM parcelas p
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE p.id = $1
              AND ao.operario_id = $2
            LIMIT 1
            `,
            [parcelaId, operarioId]
        );
        return Boolean(row);
    }

    public async create(payload: CreateCultivoDto): Promise<Cultivo> {
        const query = `
            INSERT INTO cultivos (
                tipo_cultivo,
                fecha_siembra,
                estado,
                observaciones,
                parcela_id
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                tipo_cultivo AS "tipoCultivo",
                fecha_siembra AS "fechaSiembra",
                estado,
                observaciones,
                parcela_id AS "parcelaId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;

        const row = await pool.one<CultivoRow>(query, [
            payload.tipoCultivo,
            payload.fechaSiembra,
            payload.estado,
            payload.observaciones ?? null,
            payload.parcelaId
        ]);
        return this.map(row);
    }

    public async listByPropietario(propietarioId: number): Promise<Cultivo[]> {
        const query = `
            SELECT
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE f.propietario_id = $1
            ORDER BY c.id DESC;
        `;
        const rows = await pool.manyOrNone<CultivoRow>(query, [propietarioId]);
        return rows.map((row) => this.map(row));
    }

    public async listByOperario(operarioId: number): Promise<Cultivo[]> {
        const query = `
            SELECT
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE ao.operario_id = $1
            ORDER BY c.id DESC;
        `;
        const rows = await pool.manyOrNone<CultivoRow>(query, [operarioId]);
        return rows.map((row) => this.map(row));
    }

    public async searchByTipoPropietario(propietarioId: number, tipoCultivo: string): Promise<Cultivo[]> {
        const query = `
            SELECT
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE f.propietario_id = $1
              AND LOWER(c.tipo_cultivo) LIKE LOWER($2)
            ORDER BY c.id DESC;
        `;
        const rows = await pool.manyOrNone<CultivoRow>(query, [propietarioId, `%${tipoCultivo}%`]);
        return rows.map((row) => this.map(row));
    }

    public async searchByTipoOperario(operarioId: number, tipoCultivo: string): Promise<Cultivo[]> {
        const query = `
            SELECT
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE ao.operario_id = $1
              AND LOWER(c.tipo_cultivo) LIKE LOWER($2)
            ORDER BY c.id DESC;
        `;
        const rows = await pool.manyOrNone<CultivoRow>(query, [operarioId, `%${tipoCultivo}%`]);
        return rows.map((row) => this.map(row));
    }

    public async findByIdAndPropietario(id: number, propietarioId: number): Promise<Cultivo | null> {
        const query = `
            SELECT
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE c.id = $1
              AND f.propietario_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<CultivoRow>(query, [id, propietarioId]);
        return row ? this.map(row) : null;
    }

    public async findByIdAndOperario(id: number, operarioId: number): Promise<Cultivo | null> {
        const query = `
            SELECT
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE c.id = $1
              AND ao.operario_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<CultivoRow>(query, [id, operarioId]);
        return row ? this.map(row) : null;
    }

    public async updateByPropietario(id: number, propietarioId: number, payload: UpdateCultivoDto): Promise<Cultivo | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, propietarioId];

        if (payload.tipoCultivo !== undefined) {
            fields.push(`tipo_cultivo = $${values.length + 1}`);
            values.push(payload.tipoCultivo);
        }
        if (payload.fechaSiembra !== undefined) {
            fields.push(`fecha_siembra = $${values.length + 1}`);
            values.push(payload.fechaSiembra);
        }
        if (payload.estado !== undefined) {
            fields.push(`estado = $${values.length + 1}`);
            values.push(payload.estado);
        }
        if (payload.observaciones !== undefined) {
            fields.push(`observaciones = $${values.length + 1}`);
            values.push(payload.observaciones);
        }

        if (fields.length === 0) {
            return this.findByIdAndPropietario(id, propietarioId);
        }

        const query = `
            UPDATE cultivos c
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM parcelas p, fincas f
            WHERE c.id = $1
              AND p.id = c.parcela_id
              AND f.id = p.finca_id
              AND f.propietario_id = $2
            RETURNING
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt";
        `;
        const row = await pool.oneOrNone<CultivoRow>(query, values);
        return row ? this.map(row) : null;
    }

    public async updateByOperario(id: number, operarioId: number, payload: UpdateCultivoDto): Promise<Cultivo | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, operarioId];

        if (payload.tipoCultivo !== undefined) {
            fields.push(`tipo_cultivo = $${values.length + 1}`);
            values.push(payload.tipoCultivo);
        }
        if (payload.fechaSiembra !== undefined) {
            fields.push(`fecha_siembra = $${values.length + 1}`);
            values.push(payload.fechaSiembra);
        }
        if (payload.estado !== undefined) {
            fields.push(`estado = $${values.length + 1}`);
            values.push(payload.estado);
        }
        if (payload.observaciones !== undefined) {
            fields.push(`observaciones = $${values.length + 1}`);
            values.push(payload.observaciones);
        }

        if (fields.length === 0) {
            return this.findByIdAndOperario(id, operarioId);
        }

        const query = `
            UPDATE cultivos c
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM parcelas p, asignacion_operarios ao
            WHERE c.id = $1
              AND p.id = c.parcela_id
              AND ao.parcela_id = p.id
              AND ao.operario_id = $2
            RETURNING
                c.id,
                c.tipo_cultivo AS "tipoCultivo",
                c.fecha_siembra AS "fechaSiembra",
                c.estado,
                c.observaciones,
                c.parcela_id AS "parcelaId",
                c.created_at AS "createdAt",
                c.updated_at AS "updatedAt";
        `;
        const row = await pool.oneOrNone<CultivoRow>(query, values);
        return row ? this.map(row) : null;
    }

    public async deleteByPropietario(id: number, propietarioId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM cultivos c
            USING parcelas p, fincas f
            WHERE c.id = $1
              AND p.id = c.parcela_id
              AND f.id = p.finca_id
              AND f.propietario_id = $2
            `,
            [id, propietarioId]
        );
        return result.rowCount > 0;
    }

    public async deleteByOperario(id: number, operarioId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM cultivos c
            USING parcelas p, asignacion_operarios ao
            WHERE c.id = $1
              AND p.id = c.parcela_id
              AND ao.parcela_id = p.id
              AND ao.operario_id = $2
            `,
            [id, operarioId]
        );
        return result.rowCount > 0;
    }
}
