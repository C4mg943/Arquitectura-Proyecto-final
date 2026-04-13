import { Request, Response } from "express";
import ServicioFincaActualizar from "../service/ServiceFincaActualizar";
import { FincaUpdateDto } from "../model/dto/dtoFinca";

class ControllerFincaActualizar {

    public async actualizar(req: Request, res: Response): Promise<void> {
        try {
            const idFinca = Number(req.params.idFinca);

            // Construcción del DTO asegurando que los nombres coincidan con el backend
            const objActualizar: FincaUpdateDto = {
                id: idFinca,
                nombre: req.body.nombre,
                municipio: req.body.municipio,
                departamento: req.body.departamento,
                productorId: req.body.productorId || req.body.productor_id, // Soporta ambos formatos
                area_hectareas: req.body.area_hectareas || 0,
                codigo_ica: req.body.codigo_ica || ''
            };

            const resultado = await ServicioFincaActualizar.ejecutar(objActualizar);


            switch (resultado.caso) {
                case 1: // Nombre duplicado
                    res.status(400).json({
                        success: false,
                        message: "Ya tienes otra finca registrada con ese nombre"
                    });
                    break;

                case 2:
                    if (resultado.resultadoActualizacion.rowCount > 0) {
                        res.status(200).json({
                            success: true,
                            message: "Finca actualizada correctamente",
                            data: { filasAfectadas: resultado.resultadoActualizacion.rowCount }
                        });
                    } else {
                        res.status(404).json({
                            success: false,
                            message: "La finca no existe en la base de datos"
                        });
                    }
                    break;

                case 3: // Productor inexistente
                    res.status(400).json({
                        success: false,
                        message: "El productor especificado no existe"
                    });
                    break;

                default:
                    res.status(500).json({
                        success: false,
                        message: "Caso de respuesta no controlado"
                    });
            }

        } catch (error: any) {

            console.error("Error en ControllerFincaActualizar:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al procesar la actualización",
                details: error.message || error
            });
        }
    }
}

const controllerFincaActualizar = new ControllerFincaActualizar();
export default controllerFincaActualizar;