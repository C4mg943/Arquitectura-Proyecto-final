import ServiceFincaConsultar from "../service/ServiceFincaConsultar"
import { Request, Response } from "express";
class ControllerConsultarFincas {
    public async getAll(req: Request, res: Response): Promise<void>
    {
        await  ServiceFincaConsultar.getAll(res);

    }
}
const controllerConsultarFincas = new ControllerConsultarFincas();
export default controllerConsultarFincas;