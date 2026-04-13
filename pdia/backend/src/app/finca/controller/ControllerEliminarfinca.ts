import {Request, Response} from "express";
import {FincaIdDto} from "../model/dto/dtoFinca";
import ServiceFincaBorrar from "../service/ServiceFincaEliminar";

class ControllerFincaBorrar {

    public async eliminar(req: Request, res: Response): Promise<void> {
        try {

            const objId: FincaIdDto = {
                id: Number(req.params.idFinca)
            };

            const resultado = await ServiceFincaBorrar.ejecutar(objId);

            switch (resultado.caso) {
                case 1:
                    res.status(404).json({
                        success: false,
                        message: "No se puede eliminar porque la finca no existe"
                    });
                    break;

                case 2:
                    if (resultado.resultadoEliminacion.rowCount > 0) {
                        res.status(200).json({
                            success: true,
                            message: "Finca eliminada correctamente",
                            data: {filasBorradas: resultado.resultadoEliminacion.rowCount}
                        });
                    } else {
                        res.status(404).json({
                            success: false,
                            message: "Finca no encontrada al intentar ejecutar el borrado"
                        });
                    }
                    break;
            }
        } catch (error: any) {
            console.error("Error en ControllerFincaBorrar:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al intentar borrar la finca",
                details: error.message || error
            });
        }
    }
}


const controllerFincaBorrar = new ControllerFincaBorrar();
export default controllerFincaBorrar;