import { Response } from "express";
import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";
import { FincaIdDto } from "../model/dto/dtoFinca";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";

class ServiceFincaBorrar {

    private static fincaRepo: ImpFincaRepository = new ImpFincaRepository();

    public static async ejecutar(obj: FincaIdDto, res: Response): Promise<any> {
        await pool.task(async (consulta) => {
            let caso = 0;
            let resultadoEliminacion: any;

            // CASO 1: Verificar si la finca existe antes de intentar borrar
            const existeFinca = await consulta.oneOrNone(SQL_FINCAS.FIND_BY_ID, [obj.id]);

            if (!existeFinca) {
                caso = 1;
                return { caso };
            }



            caso = 2;
            resultadoEliminacion = await this.fincaRepo.delete(obj);

            return { caso, resultadoEliminacion };

        }).then(({ caso, resultadoEliminacion }) => {
            switch (caso) {
                case 1:
                    res.status(404).json({
                        respuesta: "Error: No se puede eliminar porque la finca no existe"
                    });
                    break;

                case 2:

                    if (resultadoEliminacion.rowCount > 0) {
                        res.status(200).json({
                            respuesta: "Finca eliminada correctamente",
                            filasBorradas: resultadoEliminacion.rowCount
                        });
                    } else {
                        res.status(404).json({ respuesta: "Error inesperado: Finca no encontrada" });
                    }
                    break;

                default:
                    break;
            }
        }).catch((miError) => {
            console.error("Error en ServiceFincaBorrar:", miError);
            res.status(500).json({ respuesta: "Error interno del servidor al intentar borrar" });
        });
    }
}

export default ServiceFincaBorrar;