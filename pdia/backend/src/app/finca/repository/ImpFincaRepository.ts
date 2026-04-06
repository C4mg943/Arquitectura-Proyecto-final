import {IFincaRepository} from "../repository/IFincaRepository";
import {FincaResponseDto, FincaUpdateDto, FincaCreateDto, FincaIdDto} from "../model/dto/dtoFinca";
import pool from "../../../config/connection/dbConnetions";
import {SQL_FINCAS} from "../repository/sql_finca";

export class ImpFincaRepository implements IFincaRepository {

    async getAll(): Promise<FincaResponseDto[]> {
        try {
            const resultado = await pool.result(SQL_FINCAS.FIND_ALL);
            console.log(`✅ Filas encontradas: ${resultado.rowCount}`);
            return resultado.rows as FincaResponseDto[];

        } catch (error) {
            console.error("❌ Error al obtener las fincas:", error);
            throw new Error("No se pudieron obtener las fincas");
        }
    }
    // IMPLEMENTACIÓN DEL MÉTODO CREATE
    async create(obj: FincaCreateDto): Promise<any> {
        try {
            const resultado = await pool.one(SQL_FINCAS.ADD, [
                obj.nombre,
                obj.municipio,
                obj.departamento,
                obj.productorId
            ]);

            console.log(`Finca creada con ID: ${resultado.id}`);
            return resultado;

        } catch (error) {
            console.error("Error al insertar la finca:", error);
            throw new Error("No se pudo crear la finca en la base de datos");
        }
    }
    async update(obj: FincaUpdateDto): Promise<any> {
        try {

            const resultado = await pool.result(SQL_FINCAS.UPDATE, [
                obj.nombre,
                obj.municipio,
                obj.departamento,
                obj.productorId,
                obj.id
            ]);

            console.log(`Finca ID ${obj.id} actualizada. Filas afectadas: ${resultado.rowCount}`);
            return resultado;

        } catch (error) {
            console.error("Error al actualizar la finca:", error);
            throw new Error("Error en la base de datos al intentar actualizar");
        }
    }
    async delete(obj: FincaIdDto): Promise<any> {
        try {

            const resultado = await pool.result(SQL_FINCAS.DELETE, [obj.id]);

            console.log(`Finca ID ${obj.id} eliminada. Filas afectadas: ${resultado.rowCount}`);
            return resultado;

        } catch (error) {
            console.error("Error al eliminar la finca:", error);
            throw new Error("Error en la base de datos al intentar eliminar la finca");
        }
    }
}