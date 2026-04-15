import { IFincaRepository } from "../repository/IFincaRepository";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";

class ServiceFincaConsultar {
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();


    public static async getAll(): Promise<any[]> {
        try {
            return  await this.fincaRepo.getAll();

        } catch (miError) {
            console.error("Error en ServiceFincaConsultar:", miError);
            throw new Error("No se pudieron obtener las fincas de la base de datos.");
        }
    }
}

export default ServiceFincaConsultar;