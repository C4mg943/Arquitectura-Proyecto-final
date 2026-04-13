import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";
import { FincaUpdateDto } from "../model/dto/dtoFinca";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";
import Finca from "../model/finca";

class ServiceFincaActualizar {
    private static fincaRepo: ImpFincaRepository = new ImpFincaRepository();

    // Ya no recibe "res", ahora retorna el resultado o lanza un error
    public static async ejecutar(obj: FincaUpdateDto): Promise<any> {

        const fincaActualizar = new Finca(
            obj.id,
            obj.nombre,
            obj.municipio,
            obj.departamento,
            obj.productorId,
            obj.area_hectareas || 0,
            obj.codigo_ica || '',
            new Date()
        );

        return await pool.task(async (consulta) => {
            // Validación de Productor
            const existeProductor = await consulta.oneOrNone(SQL_FINCAS.FINDBY_PRODUCTOR, [fincaActualizar.productorId]);
            if (!existeProductor) {
                return { caso: 3 }; // Productor no existe
            }

            // Validación de Duplicados
            const duplicados = await consulta.one(SQL_FINCAS.CHECK_DUPLICADO_UPDATE, [
                fincaActualizar.nombre,
                fincaActualizar.productorId,
                fincaActualizar.id
            ]);

            if (Number(duplicados.cantidad) > 0) {
                return { caso: 1 }; // Nombre duplicado
            }

            // Ejecución de Actualización
            const resultadoActualizacion = await this.fincaRepo.update({
                id: fincaActualizar.id,
                nombre: fincaActualizar.nombre,
                municipio: fincaActualizar.municipio,
                departamento: fincaActualizar.departamento,
                productorId: fincaActualizar.productorId,
                area_hectareas: fincaActualizar.areaHectareas,
                codigo_ica: fincaActualizar.codigoIca
            });

            return { caso: 2, resultadoActualizacion };
        });
    }
}

export default ServiceFincaActualizar;