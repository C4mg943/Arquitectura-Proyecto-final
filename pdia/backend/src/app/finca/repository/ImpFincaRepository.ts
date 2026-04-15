import { IFincaRepository } from "../repository/IFincaRepository";
import { FincaResponseDto, FincaUpdateDto, FincaIdDto, FincaCreateDto } from "../model/dto/dtoFinca";
import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";

export class ImpFincaRepository implements IFincaRepository {

    async getAll(): Promise<FincaResponseDto[]> {
        try {
            return await pool.any(SQL_FINCAS.FIND_ALL);
        } catch (error) {
            console.error("Error al obtener las fincas:", error);
            throw new Error("No se pudieron obtener las fincas");
        }
    }

    async findById(id: number): Promise<FincaResponseDto | null> {
        try {
            return await pool.oneOrNone(SQL_FINCAS.FIND_BY_ID, [id]);
        } catch (error) {
            console.error("Error al buscar la finca por ID:", error);
            throw new Error("No se pudo realizar la consulta de búsqueda");
        }
    }

    async create(obj: FincaCreateDto): Promise<any> {
        try {
            return await pool.one(SQL_FINCAS.ADD, [
                obj.nombre,
                obj.municipio,
                obj.departamento,
                obj.productorId,
                obj.area_hectareas|| 0,
                obj.codigo_ica|| ''
            ]);
        } catch (error) {
            console.error("Error al insertar la finca:", error);
            throw new Error("No se pudo crear la finca en la base de datos");
        }
    }

    async update(obj: FincaUpdateDto): Promise<any> {
        try {
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

    async checkDuplicate(nombre: string, municipio: string, productorId: number): Promise<number> {
        try {
            const result = await pool.one(SQL_FINCAS.CHECK_DUPLICADO, [nombre, municipio, productorId]);
            return Number(result.cantidad);
        } catch (error) {
            console.error("Error al verificar duplicados:", error);
            throw new Error("Error al consultar duplicados");
        }
    }

    async checkProductorExists(productorId: number): Promise<boolean> {
        try {
            const result = await pool.oneOrNone(SQL_FINCAS.FINDBY_PRODUCTOR, [productorId]);
            return !!result;
        } catch (error) {
            console.error("Error al verificar productor:", error);
            throw new Error("Error al verificar existencia del productor");
        }
    }

    async checkDuplicateUpdate(nombre: string, productorId: number, fincaId: number): Promise<number> {
        try {
            const result = await pool.one(SQL_FINCAS.CHECK_DUPLICADO_UPDATE, [nombre, productorId, fincaId]);
            return Number(result.cantidad);
        } catch (error) {
            console.error("Error al verificar duplicado en actualización:", error);
            throw new Error("Error al consultar duplicados en actualización");
        }
    }
}