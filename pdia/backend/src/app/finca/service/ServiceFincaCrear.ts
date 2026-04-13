import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";
import Finca from "../model/finca";

class ServicioFincaCrear {
    public static async grabarFinca(obj: any): Promise<any> {

        const nuevaFinca = new Finca(
            0,
            obj.nombre,
            obj.municipio,
            obj.departamento,
            obj.productorId,
            obj.area_hectareas || 0,
            obj.codigo_ica || '',
            new Date()
        );

        return await pool.task(async (consulta) => {
            let caso = 1; // Por defecto: Nombre duplicado
            let objGrabado: any;


            const existeProductor = await consulta.oneOrNone(SQL_FINCAS.FINDBY_PRODUCTOR, [
                nuevaFinca.productorId,
            ]);

            if (!existeProductor) {
                caso = 3; // Productor no existe
                return { caso };
            }


            const duplicados = await consulta.one(SQL_FINCAS.CHECK_DUPLICADO, [
                nuevaFinca.nombre,
                nuevaFinca.municipio,
                nuevaFinca.productorId,
            ]);


            if (Number(duplicados.cantidad) === 0) {
                caso = 2; // Éxito
                objGrabado = await consulta.one(SQL_FINCAS.ADD, [
                    nuevaFinca.nombre,
                    nuevaFinca.municipio,
                    nuevaFinca.departamento,
                    nuevaFinca.productorId,
                    nuevaFinca.areaHectareas,
                    nuevaFinca.codigoIca
                ]);
            }

            return { caso, objGrabado };
        });
    }
}

export default ServicioFincaCrear;