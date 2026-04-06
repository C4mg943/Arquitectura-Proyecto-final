import { Response } from "express";
import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";

class ServicioFincaCrear {
    public static async grabarFinca(obj: any, res: Response): Promise<any> {
        await pool
            .task(async (consulta) => {
                let caso = 1;
                let objGrabado: any;

                // Verificar si el productor (usuario) exista
                const existeProductor = await consulta.oneOrNone(SQL_FINCAS.FINDBY_PRODUCTOR, [
                    obj.productorId,
                ]);

                if (!existeProductor) {
                    caso = 3;
                    return { caso };
                }
                const duplicados = await consulta.oneOrNone(SQL_FINCAS.CHECK_DUPLICADO, [
                    obj.nombre,
                    obj.municipio,
                    obj.productorId,
                ]);

                if (duplicados.cantidad == 0) {
                    caso = 2;
                    objGrabado = await consulta.one(SQL_FINCAS.ADD, [
                        obj.nombre,
                        obj.municipio,
                        obj.departamento,
                        obj.productorId,
                    ]);
                }

                return { caso, objGrabado };
            })
            .then(({ caso, objGrabado }) => {

                switch (caso) {
                    case 1:
                        res.status(400).json({
                            respuesta: "Error: Ya tienes una finca registrada con ese nombre"
                        });
                        break;
                    case 2:
                        res.status(200).json({
                            respuesta: "Finca creada correctamente",
                            idFinca: objGrabado.id,
                        });
                        break;
                    case 3:
                        res.status(400).json({
                            respuesta: "Error: El productor especificado no existe en el sistema"
                        });
                        break;
                }
            })
            .catch((miError) => {
                console.error(" Error en ServicioFincaCrear:", miError);
                res.status(500).json({ respuesta: "Error interno en el servidor" });
            });
    }
}

export default ServicioFincaCrear;