import { IFincaRepository } from "../repository/IFincaRepository";
import { FincaResponseDto, FincaUpdateDto, FincaIdDto } from "../model/dto/dtoFinca";
import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";

export class ImpFincaRepository implements IFincaRepository {

    async getAll(): Promise<FincaResponseDto[]> {
        try {
            // Usamos pool.any para obtener una lista directamente
            return await pool.any(SQL_FINCAS.FIND_ALL);
        } catch (error) {
            console.error("❌ Error al obtener las fincas:", error);
            throw new Error("No se pudieron obtener las fincas");
        }
    }

    async create(obj: any): Promise<any> {
        try {
            // Retornamos directamente el resultado de pool.one
            return await pool.one(SQL_FINCAS.ADD, [
                obj.nombre,
                obj.municipio,
                obj.departamento,
                obj.productorId,
                obj.area_hectareas || 0, // Nueva columna
                obj.codigo_ica || ''      // Nueva columna
            ]);
        } catch (error) {
            console.error("Error al insertar la finca:", error);
            throw new Error("No se pudo crear la finca en la base de datos");
        }
    }

    async update(obj: FincaUpdateDto): Promise<any> {
        try {
            // Usamos pool.result para obtener el rowCount (filas afectadas)
            return await pool.result(SQL_FINCAS.UPDATE, [
                obj.nombre,
                obj.municipio,
                obj.departamento,
                obj.productorId,
                obj.area_hectareas || 0,
                obj.codigo_ica || '',
                obj.id
            ]);
        } catch (error) {
            console.error("Error al actualizar la finca:", error);
            throw new Error("Error en la base de datos al intentar actualizar");
        }
    }

    async delete(obj: FincaIdDto): Promise<any> {
        try {
            return await pool.result(SQL_FINCAS.DELETE, [obj.id]);
        } catch (error) {
            console.error("Error al eliminar la finca:", error);
            throw new Error("Error en la base de datos al intentar eliminar la finca");
        }
    }
}