import ServiceFincaConsultar from "../service/ServiceFincaConsultar"
import { Request, Response } from "express";
class ControllerConsultarFincas {
    public async getAll(req: Request, res: Response): Promise<void>
    {
        try {
            const datos = await ServiceFincaConsultar.getAll();

            res.status(200).json({
                success: true,
                message: "Fincas obtenidas con éxito",
                data: datos
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || "Error interno del servidor",
            });
        }

    }
}
const controllerConsultarFincas = new ControllerConsultarFincas();
export default controllerConsultarFincas;