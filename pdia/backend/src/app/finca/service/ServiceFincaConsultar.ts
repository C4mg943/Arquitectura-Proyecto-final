import { IFincaRepository } from "../repository/IFincaRepository";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";

class ServiceFincaConsultar {
    // Es preferible inyectar el repositorio o inicializarlo aquí
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();

    /**
     * El servicio solo se encarga de la lógica de negocio.
     * No debe conocer el objeto 'res' de Express.
     */
    public static async getAll(): Promise<any[]> {
        try {
            const datos = await this.fincaRepo.getAll();


            return datos;
        } catch (miError) {
            console.error("Error en ServiceFincaConsultar:", miError);
            // Lanzamos el error para que el controlador lo capture
            throw new Error("No se pudieron obtener las fincas de la base de datos.");
        }
    }
}

export default ServiceFincaConsultar;