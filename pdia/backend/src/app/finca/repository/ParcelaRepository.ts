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
    productorId: number;
    createdAt: string;
    updatedAt: string;
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
            productorId: row.productorId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
        return new Parcela(data);
    }

    public async create(productorId: number, payload: CreateParcelaDto): Promise<Parcela> {
        const query = `
            INSERT INTO parcelas (
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                productor_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id,
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                productor_id AS "productorId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;

        const row = await pool.one<ParcelaRow>(query, [
            payload.nombre,
            payload.municipio,
            payload.hectareas,
            payload.latitud,
            payload.longitud,
            productorId
        ]);
        return this.map(row);
    }

    public async listByProductor(productorId: number): Promise<Parcela[]> {
        const query = `
            SELECT
                id,
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                productor_id AS "productorId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM parcelas
            WHERE productor_id = $1
            ORDER BY id DESC;
        `;
        const rows = await pool.manyOrNone<ParcelaRow>(query, [productorId]);
        return rows.map((row) => this.map(row));
    }

    public async findByIdAndProductor(id: number, productorId: number): Promise<Parcela | null> {
        const query = `
            SELECT
                id,
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                productor_id AS "productorId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM parcelas
            WHERE id = $1 AND productor_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<ParcelaRow>(query, [id, productorId]);
        return row ? this.map(row) : null;
    }

    public async update(id: number, productorId: number, payload: UpdateParcelaDto): Promise<Parcela | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, productorId];

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

        if (fields.length === 0) {
            return this.findByIdAndProductor(id, productorId);
        }

        const query = `
            UPDATE parcelas
            SET ${fields.join(", ")},
                updated_at = NOW()
            WHERE id = $1 AND productor_id = $2
            RETURNING
                id,
                nombre,
                municipio,
                hectareas,
                latitud,
                longitud,
                productor_id AS "productorId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;
        const row = await pool.oneOrNone<ParcelaRow>(query, values);
        return row ? this.map(row) : null;
    }

    public async delete(id: number, productorId: number): Promise<boolean> {
        const result = await pool.result(
            "DELETE FROM parcelas WHERE id = $1 AND productor_id = $2",
            [id, productorId]
        );
        return result.rowCount > 0;
    }
}
