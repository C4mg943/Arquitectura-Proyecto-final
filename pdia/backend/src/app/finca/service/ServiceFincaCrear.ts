import { Response } from "express";
import pool from "../../../config/connection/dbConnetions";
import { SQL_FINCAS } from "../repository/sql_finca";

class ServicioFincaCrear {
    public static async grabarFinca(obj: any, res: Response): Promise<any> {
        await pool
            .task(async (consulta) => {
                let caso = 1;
                let objGrabado: any;


                const existeProductor = await consulta.oneOrNone(SQL_FINCAS.FINDBY_PRODUCTOR, [
                    obj.productorId,
                ]);

                if (!existeProductor) {
                    caso = 3;
                    return { caso };
                }
               
                const duplicados = await consulta.one(SQL_FINCAS.CHECK_DUPLICADO, [
                    obj.nombre,
                    obj.municipio,
                    obj.productorId,
                ]);

                if (Number(duplicados.cantidad) === 0) {
                    caso = 2;
                    objGrabado = await consulta.one(SQL_FINCAS.ADD, [
                        obj.nombre,
                        obj.municipio,
                        obj.departamento,
                        obj.productorId,
                        obj.area_hectareas || 0,
                        obj.codigo_ica || ''
                    ]);
                }

                return { caso, objGrabado };
            })
            .then(({ caso, objGrabado }) => {
                switch (caso) {
                    case 1:
                        res.status(400).json({
                            success: false,
                            message: "Ya tienes una finca registrada con ese nombre en este municipio"
                        });
                        break;
                    case 2:
                        res.status(200).json({
                            success: true,
                            message: "Finca creada correctamente",
                            data: { idFinca: objGrabado.id }
                        });
                        break;
                    case 3:
                        res.status(400).json({
                            success: false,
                            message: "El productor especificado no existe en el sistema"
                        });
                        break;
                }
            })
            .catch((miError) => {
                console.error(" Error en ServicioFincaCrear:", miError);
                res.status(500).json({ 
                    success: false,
                    message: "Error interno en el servidor",
                    details: miError.message || miError
                });
            });
    }
}

export default ServicioFincaCrear;