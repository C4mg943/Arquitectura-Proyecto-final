import { Request, Response } from "express";
import ServicioFincaCrear from "../service/ServiceFincaCrear";
// 1. Importamos el molde (DTO)
import { FincaCreateDto } from "../model/dto/dtoFinca";

class ControladorCrearFinca {

    public async crear(req: Request, res: Response): Promise<void> {

        const objFinca: FincaCreateDto = req.body;



        await ServicioFincaCrear.grabarFinca(objFinca, res);
    }
}

const controladorCrearFinca = new ControladorCrearFinca();
export default controladorCrearFinca;