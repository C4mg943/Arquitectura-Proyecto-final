import pool from "../../../config/connection/dbConnetions";

interface AggregationRow {
    tipo: string;
    total: string | number;
}

interface DateRangeRow {
    desde: string | null;
    hasta: string | null;
}

interface CultivoOwnershipRow {
    id: number;
}

export interface RawActividadRow {
    id: number;
    tipo: string;
    fecha: string;
    descripcion: string;
    datos: Record<string, unknown> | null;
}

export class ReporteRepository {
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
