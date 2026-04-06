import {IFincaRepository} from "../repository/IFincaRepository";
import {ImpFincaRepository} from "../repository/ImpFincaRepository";
import { Response } from "express";
import Finca from "../model/finca";

class ServiceFincaConsultar {
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();

    public static async getAll(res: Response): Promise<any> {
        try {
            const datosPlanos = await this.fincaRepo.getAll();

            // Transformar datos planos a Instancias del Modelo (POO)
            const fincasModel = datosPlanos.map(f => {
                const fincaObj = new Finca(
                    f.id,
                    f.nombre,
                    f.municipio,
                    f.departamento,
                    f.productor_id,
                    f.created_at || new Date(),
                    new Date() // updatedAt
                );
                
                // Retornamos un objeto que incluya los datos de la clase y el nombre del productor para el front
                return {
                    id: fincaObj.id,
                    nombre: fincaObj.nombre,
                    municipio: fincaObj.municipio,
                    departamento: fincaObj.departamento,
                    productorId: fincaObj.productorId,
                    productorNombre: f.productor_nombre || 'No asignado',
                    areaHectareas: f.area_hectareas || 0,
                    codigoIca: f.codigo_ica || ''
                };
            });

            res.status(200).json({
                success: true,
                message: "Fincas obtenidas con éxito (Model Logic)",
                data: fincasModel
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