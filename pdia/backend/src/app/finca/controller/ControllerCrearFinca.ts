import { Request, Response } from "express";
import ServicioFincaCrear from "../service/ServiceFincaCrear";
import { FincaCreateDto } from "../model/dto/dtoFinca";

class ControladorCrearFinca {
    public async crear(req: Request, res: Response): Promise<void> {
        try {

            const objFinca: FincaCreateDto = {
                nombre: req.body.nombre,
                municipio: req.body.municipio,
                departamento: req.body.departamento,
                productorId: req.body.productor_id ,
                area_hectareas: req.body.area_hectareas || 0,
                codigo_ica: req.body.codigo_ica || ''
            };


            const resultado = await ServicioFincaCrear.grabarFinca(objFinca);

            switch (resultado.caso) {
                case 1:
                    res.status(400).json({
                        success: false,
                        message: "Ya tienes una finca registrada con ese nombre en este municipio"
                    });
                    break;

                case 2:
                    res.status(201).json({ // 201 es el estándar para "Created"
                        success: true,
                        message: "Finca creada correctamente",
                        data: { idFinca: resultado.objGrabado.id }
                    });
                    break;

                case 3:
                    res.status(400).json({
                        success: false,
                        message: "El productor especificado no existe en el sistema"
                    });
                    break;

                default:
                    res.status(500).json({
                        success: false,
                        message: "Error desconocido en el flujo de creación"
                    });
            }

        } catch (error: any) {
            console.error("Error en ControladorCrearFinca:", error);
            res.status(500).json({
                success: false,
                message: "Error interno en el servidor al intentar crear la finca",
                details: error.message || error
            });
        }
    }
}

const controladorCrearFinca = new ControladorCrearFinca();
export default controladorCrearFinca;