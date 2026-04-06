import pool from "../../../config/connection/dbConnetions";
import { Alerta } from "../model/Alerta";
import type { AlertaPersistence } from "../model/Alerta";
import type { CreateAlertaDto } from "../model/dto/AlertaDto";

interface AlertaRow {
    id: number;
    tipo: "LLUVIA" | "TEMPERATURA_ALTA" | "TEMPERATURA_BAJA" | "VIENTO";
    valorDetectado: string | number;
    fecha: string;
    cultivoId: number;
    leida: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CultivoAccessRow {
    cultivoId: number;
    propietarioId: number;
    parcelaId: number;
}

export class AlertaRepository {
    private map(row: AlertaRow): Alerta {
        const data: AlertaPersistence = {
            id: row.id,
            tipo: row.tipo,
            valorDetectado: Number(row.valorDetectado),
            fecha: new Date(row.fecha),
            cultivoId: row.cultivoId,
            leida: row.leida,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };

        return new Alerta(data);
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
        const row = await pool.oneOrNone<{ id: number }>(
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

    public async create(payload: CreateAlertaDto): Promise<Alerta> {
        const row = await pool.one<AlertaRow>(
            `
            INSERT INTO alertas (
                tipo,
                valor_detectado,
                fecha,
                cultivo_id,
                leida
            ) VALUES ($1, $2, $3, $4, FALSE)
            RETURNING
                id,
                tipo,
                valor_detectado AS "valorDetectado",
                fecha,
                cultivo_id AS "cultivoId",
                leida,
                created_at AS "createdAt",
                updated_at AS "updatedAt";
            `,
            [payload.tipo, payload.valorDetectado, payload.fecha, payload.cultivoId]
        );

        return this.map(row);
    }

    public async listByPropietario(propietarioId: number): Promise<Alerta[]> {
        const rows = await pool.manyOrNone<AlertaRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.valor_detectado AS "valorDetectado",
                a.fecha,
                a.cultivo_id AS "cultivoId",
                a.leida,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM alertas a
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

    public async listByOperario(operarioId: number): Promise<Alerta[]> {
        const rows = await pool.manyOrNone<AlertaRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.valor_detectado AS "valorDetectado",
                a.fecha,
                a.cultivo_id AS "cultivoId",
                a.leida,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM alertas a
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

    public async listByCultivoPropietario(cultivoId: number, propietarioId: number): Promise<Alerta[]> {
        const rows = await pool.manyOrNone<AlertaRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.valor_detectado AS "valorDetectado",
                a.fecha,
                a.cultivo_id AS "cultivoId",
                a.leida,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM alertas a
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

    public async listByCultivoOperario(cultivoId: number, operarioId: number): Promise<Alerta[]> {
        const rows = await pool.manyOrNone<AlertaRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.valor_detectado AS "valorDetectado",
                a.fecha,
                a.cultivo_id AS "cultivoId",
                a.leida,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM alertas a
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

    public async findByIdAndPropietario(id: number, propietarioId: number): Promise<Alerta | null> {
        const row = await pool.oneOrNone<AlertaRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.valor_detectado AS "valorDetectado",
                a.fecha,
                a.cultivo_id AS "cultivoId",
                a.leida,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM alertas a
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

    public async findByIdAndOperario(id: number, operarioId: number): Promise<Alerta | null> {
        const row = await pool.oneOrNone<AlertaRow>(
            `
            SELECT
                a.id,
                a.tipo,
                a.valor_detectado AS "valorDetectado",
                a.fecha,
                a.cultivo_id AS "cultivoId",
                a.leida,
                a.created_at AS "createdAt",
                a.updated_at AS "updatedAt"
            FROM alertas a
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

    public async deleteByPropietario(id: number, propietarioId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM alertas a
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
            DELETE FROM alertas a
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
