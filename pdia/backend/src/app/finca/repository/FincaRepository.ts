import pool from "../../../config/connection/dbConnetions";
import { Finca, FincaPersistence, TipoFinca } from "../model/Finca";
import { CreateFincaDto, UpdateFincaDto } from "../model/dto/FincaDto";

interface FincaRow {
    id: number;
    nombre: string;
    ubicacion: string;
    descripcion: string | null;
    area: string | number;
    tipoFinca: TipoFinca;
    fechaRegistro: string;
    codigoIcaInvima: string | null;
    propietarioId: number;
    createdAt: string;
    updatedAt: string;
}

export class FincaRepository {
    private map(row: FincaRow): Finca {
        const data: FincaPersistence = {
            id: row.id,
            nombre: row.nombre,
            ubicacion: row.ubicacion,
            descripcion: row.descripcion,
            area: Number(row.area),
            tipoFinca: row.tipoFinca,
            fechaRegistro: new Date(row.fechaRegistro),
            codigoIcaInvima: row.codigoIcaInvima,
            propietarioId: row.propietarioId,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
        return new Finca(data);
    }

    public async create(propietarioId: number, payload: CreateFincaDto): Promise<Finca> {
        const query = `
            INSERT INTO fincas (
                nombre,
                ubicacion,
                descripcion,
                area,
                tipo_finca,
                fecha_registro,
                codigo_ica_invima,
                propietario_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                id,
                nombre,
                ubicacion,
                descripcion,
                area,
                tipo_finca AS "tipoFinca",
                fecha_registro AS "fechaRegistro",
                codigo_ica_invima AS "codigoIcaInvima",
                propietario_id AS "propietarioId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;

        const row = await pool.one<FincaRow>(query, [
            payload.nombre,
            payload.ubicacion,
            payload.descripcion ?? null,
            payload.area,
            payload.tipoFinca,
            payload.fechaRegistro ?? new Date().toISOString().split("T")[0],
            payload.codigoIcaInvima ?? null,
            propietarioId
        ]);
        return this.map(row);
    }

    public async listByPropietario(propietarioId: number): Promise<Finca[]> {
        const query = `
            SELECT
                id,
                nombre,
                ubicacion,
                descripcion,
                area,
                tipo_finca AS "tipoFinca",
                fecha_registro AS "fechaRegistro",
                codigo_ica_invima AS "codigoIcaInvima",
                propietario_id AS "propietarioId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM fincas
            WHERE propietario_id = $1
            ORDER BY id DESC;
        `;
        const rows = await pool.manyOrNone<FincaRow>(query, [propietarioId]);
        return rows.map((row) => this.map(row));
    }

    public async findByIdAndPropietario(id: number, propietarioId: number): Promise<Finca | null> {
        const query = `
            SELECT
                id,
                nombre,
                ubicacion,
                descripcion,
                area,
                tipo_finca AS "tipoFinca",
                fecha_registro AS "fechaRegistro",
                codigo_ica_invima AS "codigoIcaInvima",
                propietario_id AS "propietarioId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM fincas
            WHERE id = $1
              AND propietario_id = $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<FincaRow>(query, [id, propietarioId]);
        return row ? this.map(row) : null;
    }

    public async update(id: number, propietarioId: number, payload: UpdateFincaDto): Promise<Finca | null> {
        const fields: string[] = [];
        const values: unknown[] = [id, propietarioId];

        if (payload.nombre !== undefined) {
            fields.push(`nombre = $${values.length + 1}`);
            values.push(payload.nombre);
        }
        if (payload.ubicacion !== undefined) {
            fields.push(`ubicacion = $${values.length + 1}`);
            values.push(payload.ubicacion);
        }
        if (payload.descripcion !== undefined) {
            fields.push(`descripcion = $${values.length + 1}`);
            values.push(payload.descripcion);
        }
        if (payload.area !== undefined) {
            fields.push(`area = $${values.length + 1}`);
            values.push(payload.area);
        }
        if (payload.tipoFinca !== undefined) {
            fields.push(`tipo_finca = $${values.length + 1}`);
            values.push(payload.tipoFinca);
        }
        if (payload.fechaRegistro !== undefined) {
            fields.push(`fecha_registro = $${values.length + 1}`);
            values.push(payload.fechaRegistro);
        }
        if (payload.codigoIcaInvima !== undefined) {
            fields.push(`codigo_ica_invima = $${values.length + 1}`);
            values.push(payload.codigoIcaInvima);
        }

        if (fields.length === 0) {
            return this.findByIdAndPropietario(id, propietarioId);
        }

        const query = `
            UPDATE fincas
            SET ${fields.join(", ")},
                updated_at = NOW()
            WHERE id = $1
              AND propietario_id = $2
            RETURNING
                id,
                nombre,
                ubicacion,
                descripcion,
                area,
                tipo_finca AS "tipoFinca",
                fecha_registro AS "fechaRegistro",
                codigo_ica_invima AS "codigoIcaInvima",
                propietario_id AS "propietarioId",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;

        const row = await pool.oneOrNone<FincaRow>(query, values);
        return row ? this.map(row) : null;
    }

    public async delete(id: number, propietarioId: number): Promise<boolean> {
        const result = await pool.result(
            "DELETE FROM fincas WHERE id = $1 AND propietario_id = $2",
            [id, propietarioId]
        );
        return result.rowCount > 0;
    }

    public async existsByIdAndPropietario(id: number, propietarioId: number): Promise<boolean> {
        const row = await pool.oneOrNone<{ id: number }>(
            "SELECT id FROM fincas WHERE id = $1 AND propietario_id = $2 LIMIT 1",
            [id, propietarioId]
        );
        return Boolean(row);
    }
}
