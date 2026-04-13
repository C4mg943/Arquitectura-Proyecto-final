import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";
import { FincaIdDto } from "../model/dto/dtoFinca";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";

class ServiceFincaBorrar {
    private static fincaRepo: ImpFincaRepository = new ImpFincaRepository();

    public static async ejecutar(obj: FincaIdDto): Promise<any> {
        return await pool.task(async (consulta) => {

            const existeFinca = await consulta.oneOrNone(SQL_FINCAS.FIND_BY_ID, [obj.id]);

            if (!existeFinca) {
                return { caso: 1 };
            }


            const resultadoEliminacion = await this.fincaRepo.delete(obj);
            return { caso: 2, resultadoEliminacion };
        });
    }
}

export default ServiceFincaBorrar;