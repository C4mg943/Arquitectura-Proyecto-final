import { FincaUpdateDto } from "../model/dto/dtoFinca";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";
import { IFincaRepository } from "../repository/IFincaRepository";

class ServiceFincaActualizar {
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();

    public static async ejecutar(obj: FincaUpdateDto): Promise<any> {
        // Validación de Productor
        const existeProductor = await this.fincaRepo.checkProductorExists(obj.productorId);
        if (!existeProductor) {
            return { caso: 3 }; // Productor no existe
        }

        // Validación de Duplicados
        const duplicados = await this.fincaRepo.checkDuplicateUpdate(
            obj.nombre,
            obj.productorId,
            obj.id
        );

        if (duplicados > 0) {
            return { caso: 1 }; // Nombre duplicado
        }

        // Ejecución de Actualización
        const resultadoActualizacion = await this.fincaRepo.update(obj);
        return { caso: 2, resultadoActualizacion };
    }
}

export default ServiceFincaActualizar;