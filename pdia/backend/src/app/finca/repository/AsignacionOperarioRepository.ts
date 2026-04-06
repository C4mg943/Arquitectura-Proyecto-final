import pool from "../../../config/connection/dbConnetions";
import { AsignacionOperario, AsignacionOperarioPersistence } from "../model/AsignacionOperario";

interface AsignacionRow {
    id: number;
    operarioId: number;
    parcelaId: number;
    asignadoPorId: number;
    fechaAsignacion: string;
}

interface OperarioConParcelaRow {
    operarioId: number;
    operarioNombre: string;
    operarioIdentificacion: string;
    operarioEmail: string;
    operarioRol: "OPERARIO";
    parcelaId: number | null;
    parcelaNombre: string | null;
    parcelaMunicipio: string | null;
    parcelaHectareas: string | number | null;
    fincaId: number | null;
}

interface ParcelaAsignadaRow {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: string | number;
    fincaId: number;
}

interface FincaIdRow {
    fincaId: number;
}

export class AsignacionOperarioRepository {
    private map(row: AsignacionRow): AsignacionOperario {
        const data: AsignacionOperarioPersistence = {
            id: row.id,
            operarioId: row.operarioId,
            parcelaId: row.parcelaId,
            asignadoPorId: row.asignadoPorId,
            fechaAsignacion: new Date(row.fechaAsignacion)
        };
        return new AsignacionOperario(data);
    }

    public async asignar(operarioId: number, parcelaId: number, asignadoPorId: number): Promise<AsignacionOperario> {
        const query = `
            INSERT INTO asignacion_operarios (
                operario_id,
                parcela_id,
                asignado_por_id
            ) VALUES ($1, $2, $3)
            RETURNING
                id,
                operario_id AS "operarioId",
                parcela_id AS "parcelaId",
                asignado_por_id AS "asignadoPorId",
                fecha_asignacion AS "fechaAsignacion";
        `;

        const row = await pool.one<AsignacionRow>(query, [operarioId, parcelaId, asignadoPorId]);
        return this.map(row);
    }

    public async desasignar(operarioId: number, parcelaId: number): Promise<boolean> {
        const result = await pool.result(
            "DELETE FROM asignacion_operarios WHERE operario_id = $1 AND parcela_id = $2",
            [operarioId, parcelaId]
        );
        return result.rowCount > 0;
    }

    public async existsAsignacion(operarioId: number, parcelaId: number): Promise<boolean> {
        const row = await pool.oneOrNone<{ id: number }>(
            "SELECT id FROM asignacion_operarios WHERE operario_id = $1 AND parcela_id = $2 LIMIT 1",
            [operarioId, parcelaId]
        );
        return Boolean(row);
    }

    public async listParcelasByOperario(operarioId: number): Promise<ParcelaAsignadaRow[]> {
        const query = `
            SELECT
                p.id,
                p.nombre,
                p.municipio,
                p.hectareas,
                p.finca_id AS "fincaId"
            FROM asignacion_operarios ao
            INNER JOIN parcelas p ON p.id = ao.parcela_id
            WHERE ao.operario_id = $1
            ORDER BY p.id DESC;
        `;
        return pool.manyOrNone<ParcelaAsignadaRow>(query, [operarioId]);
    }

    public async listOperariosConParcelas(productorId: number): Promise<OperarioConParcelaRow[]> {
        const query = `
            SELECT
                u.id AS "operarioId",
                u.nombre AS "operarioNombre",
                u.identificacion AS "operarioIdentificacion",
                u.email AS "operarioEmail",
                u.rol AS "operarioRol",
                p.id AS "parcelaId",
                p.nombre AS "parcelaNombre",
                p.municipio AS "parcelaMunicipio",
                p.hectareas AS "parcelaHectareas",
                p.finca_id AS "fincaId"
            FROM users u
            LEFT JOIN asignacion_operarios ao
                ON ao.operario_id = u.id
            LEFT JOIN parcelas p
                ON p.id = ao.parcela_id
            LEFT JOIN fincas f
                ON f.id = p.finca_id
            WHERE u.rol = 'OPERARIO'
              AND u.productor_id = $1
              AND (f.propietario_id = $1 OR p.id IS NULL)
            ORDER BY u.id DESC, p.id DESC;
        `;

        return pool.manyOrNone<OperarioConParcelaRow>(query, [productorId]);
    }

    public async operarioPerteneceAProductor(operarioId: number, productorId: number): Promise<boolean> {
        const row = await pool.oneOrNone<{ id: number }>(
            `
            SELECT id
            FROM users
            WHERE id = $1
              AND rol = 'OPERARIO'
              AND productor_id = $2
            LIMIT 1;
            `,
            [operarioId, productorId]
        );
        return Boolean(row);
    }

    public async parcelaPerteneceAProductor(parcelaId: number, productorId: number): Promise<boolean> {
        const row = await pool.oneOrNone<{ id: number }>(
            `
            SELECT p.id
            FROM parcelas p
            INNER JOIN fincas f ON f.id = p.finca_id
            WHERE p.id = $1
              AND f.propietario_id = $2
            LIMIT 1;
            `,
            [parcelaId, productorId]
        );
        return Boolean(row);
    }

    public async findFincaIdByParcela(parcelaId: number): Promise<number | null> {
        const row = await pool.oneOrNone<FincaIdRow>(
            "SELECT finca_id AS \"fincaId\" FROM parcelas WHERE id = $1 LIMIT 1",
            [parcelaId]
        );
        return row ? row.fincaId : null;
    }

    public async listAssignedFincaIdsByOperario(operarioId: number): Promise<number[]> {
        const rows = await pool.manyOrNone<FincaIdRow>(
            `
            SELECT DISTINCT p.finca_id AS "fincaId"
            FROM asignacion_operarios ao
            INNER JOIN parcelas p ON p.id = ao.parcela_id
            WHERE ao.operario_id = $1;
            `,
            [operarioId]
        );

        return rows.map((row) => row.fincaId);
    }
}

export type { OperarioConParcelaRow, ParcelaAsignadaRow };
