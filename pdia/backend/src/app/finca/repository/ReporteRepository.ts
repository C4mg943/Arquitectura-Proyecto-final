import pool from "../../../config/connection/dbConnetions";

interface AggregationRow {
    tipo: string;
    total: string | number;
}

interface DateRangeRow {
    desde: string | null;
    hasta: string | null;
}

interface CultivoAccessRow {
    cultivoId: number;
    propietarioId: number;
    parcelaId: number;
}

export interface RawActividadRow {
    id: number;
    tipo: string;
    fecha: string;
    descripcion: string;
    datos: Record<string, unknown> | null;
}

export class ReporteRepository {
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
            LIMIT 1;
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
        const row = await pool.oneOrNone<{ id: number }>(
            `
            SELECT id
            FROM asignacion_operarios
            WHERE operario_id = $1
              AND parcela_id = $2
            LIMIT 1;
            `,
            [operarioId, parcelaId]
        );

        return Boolean(row);
    }

    public async aggregateByTipo(cultivoId: number): Promise<Record<string, number>> {
        const rows = await pool.manyOrNone<AggregationRow>(
            `
            SELECT
                tipo,
                COUNT(*) AS total
            FROM actividades
            WHERE cultivo_id = $1
            GROUP BY tipo;
            `,
            [cultivoId]
        );

        const result: Record<string, number> = {};
        rows.forEach((row) => {
            result[row.tipo] = Number(row.total);
        });

        return result;
    }

    public async getDateRange(cultivoId: number): Promise<{ desde: string | null; hasta: string | null; }> {
        const row = await pool.one<DateRangeRow>(
            `
            SELECT
                MIN(fecha)::text AS desde,
                MAX(fecha)::text AS hasta
            FROM actividades
            WHERE cultivo_id = $1;
            `,
            [cultivoId]
        );

        return {
            desde: row.desde,
            hasta: row.hasta
        };
    }

    public async getRawActivities(cultivoId: number, tipo?: string): Promise<RawActividadRow[]> {
        if (tipo) {
            return pool.manyOrNone<RawActividadRow>(
                `
                SELECT
                    id,
                    tipo,
                    fecha::text AS fecha,
                    descripcion,
                    datos
                FROM actividades
                WHERE cultivo_id = $1
                  AND tipo = $2
                ORDER BY fecha DESC, id DESC;
                `,
                [cultivoId, tipo]
            );
        }

        return pool.manyOrNone<RawActividadRow>(
            `
            SELECT
                id,
                tipo,
                fecha::text AS fecha,
                descripcion,
                datos
            FROM actividades
            WHERE cultivo_id = $1
            ORDER BY fecha DESC, id DESC;
            `,
            [cultivoId]
        );
    }
}
