import { Request, Response } from "express";
import { FincaIdDto } from "../model/dto/dtoFinca";
import ServiceFincaBorrar from "../service/ServiceFincaEliminar";

class ControllerFincaBorrar {

    public async eliminar(req: Request, res: Response): Promise<void> {

        const objIdDto: FincaIdDto = {
            id: Number(req.params.idFinca)
        };


        await  ServiceFincaBorrar.ejecutar(objIdDto, res);
    }
}

const controllerFincaBorrar = new ControllerFincaBorrar();
export default controllerFincaBorrar;