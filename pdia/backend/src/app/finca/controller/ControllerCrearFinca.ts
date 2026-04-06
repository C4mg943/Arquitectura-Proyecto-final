import { Request, Response } from "express";
import ServicioFincaCrear from "../service/ServiceFincaCrear";
import { FincaCreateDto } from "../model/dto/dtoFinca";

class ControladorCrearFinca {
    public async crear(req: Request, res: Response): Promise<void> {
        const objFinca: FincaCreateDto = {
            nombre: req.body.nombre,
            municipio: req.body.municipio,
            departamento: req.body.departamento,
            productorId: req.body.productorId,
            area_hectareas: req.body.area_hectareas || 0,
            codigo_ica: req.body.codigo_ica || ''
        };

        await ServicioFincaCrear.grabarFinca(objFinca, res);
    }
}

const controladorCrearFinca = new ControladorCrearFinca();
export default controladorCrearFinca;