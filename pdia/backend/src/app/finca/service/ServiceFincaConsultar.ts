import {IFincaRepository} from "../repository/IFincaRepository";
import {ImpFincaRepository} from "../repository/ImpFincaRepository";
import { Response } from "express";
class ServiceFincaConsultar {
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();


    public static async getAll(res: Response): Promise<any> {
        try {
            const datos = await this.fincaRepo.getAll();


            res.status(200).json({
                success: true,
                message: "Fincas obtenidas con éxito",
                data: datos
            });

        } catch (miError) {
            console.error("Error en ServiceFincaConsultar:", miError);

            res.status(500).json({
                success: false,
                message: "Error al procesar la consulta",
                details: miError
            });
        }
    }


}
export default ServiceFincaConsultar;