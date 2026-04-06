import { Response } from "express";
import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";
import { FincaUpdateDto } from "../model/dto/dtoFinca";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";
import Finca from "../model/finca";

class ServiceFincaActualizar {
    private static fincaRepo: ImpFincaRepository = new ImpFincaRepository();

    public static async ejecutar(obj: FincaUpdateDto, res: Response): Promise<any> {

        // Creamos instancia del modelo con 8 argumentos (sin updatedAt)
        const fincaActualizar = new Finca(
            obj.id,
            obj.nombre,
            obj.municipio,
            obj.departamento,
            obj.productorId,
            obj.area_hectareas || 0,
            obj.codigo_ica || '',
            new Date() // createdAt temporal
        );

        await pool.task(async (consulta) => {
            let caso = 1;
            let resultadoActualizacion: any;

            const existeProductor = await consulta.oneOrNone(SQL_FINCAS.FINDBY_PRODUCTOR, [fincaActualizar.productorId]);
            if (!existeProductor) {
                caso = 3;
                return { caso };
            }

            const duplicados = await consulta.one(SQL_FINCAS.CHECK_DUPLICADO_UPDATE, [
                fincaActualizar.nombre,
                fincaActualizar.productorId,
                fincaActualizar.id
            ]);


            if (Number(duplicados.cantidad) > 0) {
                caso = 1;
                return { caso };
            }

            caso = 2;
            resultadoActualizacion = await this.fincaRepo.update({
                id: fincaActualizar.id,
                nombre: fincaActualizar.nombre,
                municipio: fincaActualizar.municipio,
                departamento: fincaActualizar.departamento,
                productorId: fincaActualizar.productorId,
                area_hectareas: fincaActualizar.areaHectareas,
                codigo_ica: fincaActualizar.codigoIca
            });

            return { caso, resultadoActualizacion };

        }).then(({ caso, resultadoActualizacion }) => {
            switch (caso) {
                case 1:
                    res.status(400).json({
                        success: false,
                        message: "Ya tienes otra finca registrada con ese nombre"
                    });
                    break;
                case 2:
                    if (resultadoActualizacion.rowCount > 0) {
                        res.status(200).json({
                            success: true,
                            message: "Finca actualizada correctamente (Model Logic)",
                            data: { filasAfectadas: resultadoActualizacion.rowCount }
                        });
                    } else {
                        res.status(404).json({
                            success: false,
                            message: "La finca no existe"
                        });
                    }
                    break;
                case 3:
                    res.status(400).json({
                        success: false,
                        message: "El productor especificado no existe"
                    });
                    break;
            }
        }).catch((miError) => {
            console.error("Error en ServicioFincaActualizar:", miError);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al actualizar",
                details: miError.message || miError
            });
        });
    }
}

export default ServiceFincaActualizar;