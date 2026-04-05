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

interface CultivoOwnershipRow {
    id: number;
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

    public async listByProductor(productorId: number): Promise<Alerta[]> {
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
            WHERE p.productor_id = $1
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [productorId]
        );

        return rows.map((row) => this.map(row));
    }

    public async listByCultivo(cultivoId: number, productorId: number): Promise<Alerta[]> {
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
            WHERE a.cultivo_id = $1
              AND p.productor_id = $2
            ORDER BY a.fecha DESC, a.id DESC;
            `,
            [cultivoId, productorId]
        );

        return rows.map((row) => this.map(row));
    }

    public async findByIdAndProductor(id: number, productorId: number): Promise<Alerta | null> {
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
            WHERE a.id = $1
              AND p.productor_id = $2
            LIMIT 1;
            `,
            [id, productorId]
        );

        return row ? this.map(row) : null;
    }

    public async delete(id: number, productorId: number): Promise<boolean> {
        const result = await pool.result(
            `
            DELETE FROM alertas a
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
