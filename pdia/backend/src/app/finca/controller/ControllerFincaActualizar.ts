import { Request, Response } from "express";
import ServicioFincaActualizar from "../service/ServiceFincaActualizar";
import { FincaUpdateDto } from "../model/dto/dtoFinca";

class ControllerFincaActualizar {

    public async actualizar(req: Request, res: Response): Promise<void> {

        const idFinca = Number(req.params.idFinca);


        const objActualizar: FincaUpdateDto = {
            id: idFinca,
            nombre: req.body.nombre,
            municipio: req.body.municipio,
            departamento: req.body.departamento,
            productorId: req.body.productorId
        };


        await ServicioFincaActualizar.ejecutar(objActualizar, res);
    }
}

const controllerFincaActualizar = new ControllerFincaActualizar();
export default controllerFincaActualizar;