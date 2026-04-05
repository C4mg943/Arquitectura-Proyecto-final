import pool from "../../../config/connection/dbConnetions";
import { Actividad } from "../model/Actividad";
import type { ActividadPersistence } from "../model/Actividad";
import type { CreateActividadDto, UpdateActividadDto } from "../model/dto/ActividadDto";

interface ActividadRow {
    id: number;
    tipo: "RIEGO" | "FERTILIZACION" | "PLAGA" | "OBSERVACION";
    fecha: string;
    descripcion: string;
    datos: Record<string, unknown> | null;
    cultivoId: number;
    creadoPorId: number;
    createdAt: string;
    updatedAt: string;
}

interface CultivoOwnershipRow {
    id: number;
}

export class ActividadRepository {
    private map(row: ActividadRow): Actividad {
        const data: ActividadPersistence = {
            id: row.id,
            tipo: row.tipo,
            fecha: new Date(row.fecha),
            descripcion: row.descripcion,
            datos: row.datos,
            cultivoId: row.cultivoId,
            creadoPorId: row.creadoPorId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };

        return new Actividad(data);
    }

    public async cultivoBelongsToProductor(cultivoId: number, productorId: number): Promise<boolean> {
        const row = await pool.oneOrNone<CultivoOwnershipRow>(
            `
            SELECT c.id
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            WHERE c.id = $1
              AND p.productor_id = $2
            LIMIT 1;
            `,
            [cultivoId, productorId]
        );

        return Boolean(row);
    }

    public async create(creadoPorId: number, payload: CreateActividadDto): Promise<Actividad> {
        const row = await pool.one<ActividadRow>(
            `
            INSERT INTO actividades (
                tipo,
                fecha,
                descripcion,
                datos,
                cultivo_id,
                creado_por_id
            ) VALUES ($1, $2, $3, $4::jsonb, $5, $6)
            RETURNING
                id,
                tipo,
                fecha,
                descripcion,
                datos,
                cultivo_id AS "cultivoId",
                creado_por_id AS "creadoPorId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
            `,
            [
                payload.tipo,
                payload.fecha,
                payload.descripcion,
                payload.datos ? JSON.stringify(payload.datos) : null,
                payload.cultivoId,
                creadoPorId
            ]
        );

        return this.map(row);
    }

    public async listByProductor(productorId: number): Promise<Actividad[]> {
        const rows = await pool.manyOrNone<ActividadRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.fecha,
                a.descripcion,
                a.datos,
                a.cultivo_id AS "cultivoId",
                a.creado_por_id AS "creadoPorId",
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM actividades a
            INNER JOIN cultivos c ON c.id = a.cultivo_id
            INNER JOIN parcelas p ON p.id = c.parcela_id
            WHERE p.productor_id = $1
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [productorId]
        );

        return rows.map((row) => this.map(row));
    }

    public async listByCultivo(cultivoId: number, productorId: number): Promise<Actividad[]> {
        const rows = await pool.manyOrNone<ActividadRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.fecha,
                a.descripcion,
                a.datos,
                a.cultivo_id AS "cultivoId",
                a.creado_por_id AS "creadoPorId",
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM actividades a
            INNER JOIN cultivos c ON c.id = a.cultivo_id
            INNER JOIN parcelas p ON p.id = c.parcela_id
            WHERE a.cultivo_id = $1
              AND p.productor_id = $2
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [cultivoId, productorId]
        );

        return rows.map((row) => this.map(row));
    }

    public async findByIdAndProductor(id: number, productorId: number): Promise<Actividad | null> {
        const row = await pool.oneOrNone<ActividadRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.fecha,
                a.descripcion,
                a.datos,
                a.cultivo_id AS "cultivoId",
                a.creado_por_id AS "creadoPorId",
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM actividades a
            INNER JOIN cultivos c ON c.id = a.cultivo_id
            INNER JOIN parcelas p ON p.id = c.parcela_id
            WHERE a.id = $1
              AND p.productor_id = $2
            LIMIT 1;
            `,
            [id, productorId]
        );

        return row ? this.map(row) : null;
    }

    public async update(id: number, productorId: number, payload: UpdateActividadDto): Promise<Actividad | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, productorId];

        if (payload.tipo !== undefined) {
            fields.push(`tipo = $${values.length + 1}`);
            values.push(payload.tipo);
        }

        if (payload.fecha !== undefined) {
            fields.push(`fecha = $${values.length + 1}`);
            values.push(payload.fecha);
        }

        if (payload.descripcion !== undefined) {
            fields.push(`descripcion = $${values.length + 1}`);
            values.push(payload.descripcion);
        }

        if (payload.datos !== undefined) {
            fields.push(`datos = $${values.length + 1}::jsonb`);
            values.push(JSON.stringify(payload.datos));
        }

        if (fields.length === 0) {
            return this.findByIdAndProductor(id, productorId);
        }

        const row = await pool.oneOrNone<ActividadRow>(
            `
            UPDATE actividades a
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            WHERE a.id = $1
              AND c.id = a.cultivo_id
              AND p.productor_id = $2
            RETURNING
                a.id,
                a.tipo,
                a.fecha,
                a.descripcion,
                a.datos,
                a.cultivo_id AS "cultivoId",
                a.creado_por_id AS "creadoPorId",
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt";
            `,
            values
        );

        return row ? this.map(row) : null;
    }

    public async delete(id: number, productorId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM actividades a
            USING cultivos c, parcelas p
            WHERE a.id = $1
              AND c.id = a.cultivo_id
              AND p.id = c.parcela_id
              AND p.productor_id = $2;
            `,
            [id, productorId]
        );

        return result.rowCount > 0;
    }
}
