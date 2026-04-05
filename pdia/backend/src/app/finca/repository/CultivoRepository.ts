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

interface ParcelaOwnershipRow {
    id: number;
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

    public async parcelaBelongsToProductor(parcelaId: number, productorId: number): Promise<boolean> {
        const row = await pool.oneOrNone<ParcelaOwnershipRow>(
            "SELECT id FROM parcelas WHERE id = $1 AND productor_id = $2 LIMIT 1",
            [parcelaId, productorId]
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

    public async listByProductor(productorId: number): Promise<Cultivo[]> {
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
            WHERE p.productor_id = $1
            ORDER BY c.id DESC;
        `;
        const rows = await pool.manyOrNone<CultivoRow>(query, [productorId]);
        return rows.map((row) => this.map(row));
    }

    public async searchByTipo(productorId: number, tipoCultivo: string): Promise<Cultivo[]> {
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
            WHERE p.productor_id = $1
              AND LOWER(c.tipo_cultivo) LIKE LOWER($2)
            ORDER BY c.id DESC;
        `;
        const rows = await pool.manyOrNone<CultivoRow>(query, [productorId, `%${tipoCultivo}%`]);
        return rows.map((row) => this.map(row));
    }

    public async findByIdAndProductor(id: number, productorId: number): Promise<Cultivo | null> {
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
            WHERE c.id = $1
              AND p.productor_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<CultivoRow>(query, [id, productorId]);
        return row ? this.map(row) : null;
    }

    public async update(id: number, productorId: number, payload: UpdateCultivoDto): Promise<Cultivo | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, productorId];

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
            return this.findByIdAndProductor(id, productorId);
        }

        const query = `
            UPDATE cultivos c
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM parcelas p
            WHERE c.id = $1
              AND p.id = c.parcela_id
              AND p.productor_id = $2
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

    public async delete(id: number, productorId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM cultivos c
            USING parcelas p
            WHERE c.id = $1
              AND p.id = c.parcela_id
              AND p.productor_id = $2
            `,
            [id, productorId]
        );
        return result.rowCount > 0;
    }
}
