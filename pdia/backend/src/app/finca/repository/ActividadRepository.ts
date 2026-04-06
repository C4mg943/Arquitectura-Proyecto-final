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

interface CultivoAccessRow {
    cultivoId: number;
    propietarioId: number;
    parcelaId: number;
}

interface OperarioAsignacionRow {
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

    public async findCultivoAccess(cultivoId: number): Promise<{ cultivoId: number; propietarioId: number; parcelaId: number; } | null> {
        const row = await pool.oneOrNone<CultivoAccessRow>(
            `
            SELECT
                c.id AS "cultivoId",
                f.propietario_id AS "propietarioId",
                p.id AS "parcelaId"
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE c.id = $1
            LIMIT 1
            `,
            [cultivoId]
        );

        if (!row) {
            return null;
        }

        return {
            cultivoId: row.cultivoId,
            propietarioId: row.propietarioId,
            parcelaId: row.parcelaId
        };
    }

    public async operarioTieneAsignacion(operarioId: number, parcelaId: number): Promise<boolean> {
        const row = await pool.oneOrNone<OperarioAsignacionRow>(
            `
            SELECT id
            FROM asignacion_operarios
            WHERE operario_id = $1
              AND parcela_id = $2
            LIMIT 1
            `,
            [operarioId, parcelaId]
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

    public async listByPropietario(propietarioId: number): Promise<Actividad[]> {
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
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE f.propietario_id = $1
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [propietarioId]
        );

        return rows.map((row) => this.map(row));
    }

    public async listByOperario(operarioId: number): Promise<Actividad[]> {
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
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE ao.operario_id = $1
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [operarioId]
        );

        return rows.map((row) => this.map(row));
    }

    public async listByCultivoPropietario(cultivoId: number, propietarioId: number): Promise<Actividad[]> {
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
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE a.cultivo_id = $1
              AND f.propietario_id = $2
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [cultivoId, propietarioId]
        );

        return rows.map((row) => this.map(row));
    }

    public async listByCultivoOperario(cultivoId: number, operarioId: number): Promise<Actividad[]> {
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
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE a.cultivo_id = $1
              AND ao.operario_id = $2
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [cultivoId, operarioId]
        );

        return rows.map((row) => this.map(row));
    }

    public async findByIdAndPropietario(id: number, propietarioId: number): Promise<Actividad | null> {
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
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE a.id = $1
              AND f.propietario_id = $2
            LIMIT 1;
            `,
            [id, propietarioId]
        );

        return row ? this.map(row) : null;
    }

    public async findByIdAndOperario(id: number, operarioId: number): Promise<Actividad | null> {
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
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE a.id = $1
              AND ao.operario_id = $2
            LIMIT 1;
            `,
            [id, operarioId]
        );

        return row ? this.map(row) : null;
    }

    public async updateByPropietario(id: number, propietarioId: number, payload: UpdateActividadDto): Promise<Actividad | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, propietarioId];

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
            return this.findByIdAndPropietario(id, propietarioId);
        }

        const row = await pool.oneOrNone<ActividadRow>(
            `
            UPDATE actividades a
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE a.id = $1
              AND c.id = a.cultivo_id
              AND f.propietario_id = $2
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

    public async updateByOperario(id: number, operarioId: number, payload: UpdateActividadDto): Promise<Actividad | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, operarioId];

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
            return this.findByIdAndOperario(id, operarioId);
        }

        const row = await pool.oneOrNone<ActividadRow>(
            `
            UPDATE actividades a
            SET ${fields.join(", ")},
                updated_at = NOW()
            FROM cultivos c
            INNER JOIN parcelas p ON p.id = c.parcela_id
            INNER JOIN asignacion_operarios ao ON ao.parcela_id = p.id
            WHERE a.id = $1
              AND c.id = a.cultivo_id
              AND ao.operario_id = $2
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

    public async deleteByPropietario(id: number, propietarioId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM actividades a
            USING cultivos c, parcelas p, fincas f
            WHERE a.id = $1
              AND c.id = a.cultivo_id
              AND p.id = c.parcela_id
              AND f.id = p.finca_id
              AND f.propietario_id = $2;
            `,
            [id, propietarioId]
        );

        return result.rowCount > 0;
    }

    public async deleteByOperario(id: number, operarioId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM actividades a
            USING cultivos c, parcelas p, asignacion_operarios ao
            WHERE a.id = $1
              AND c.id = a.cultivo_id
              AND p.id = c.parcela_id
              AND ao.parcela_id = p.id
              AND ao.operario_id = $2;
            `,
            [id, operarioId]
        );

        return result.rowCount > 0;
    }
}
