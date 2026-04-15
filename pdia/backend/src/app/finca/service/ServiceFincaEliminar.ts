import { FincaIdDto } from "../model/dto/dtoFinca";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";
import { IFincaRepository } from "../repository/IFincaRepository";

class ServiceFincaBorrar {
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();

    public static async ejecutar(obj: FincaIdDto): Promise<any> {
        const existeFinca = await this.fincaRepo.findById(obj.id);

        if (!existeFinca) {
            return { caso: 1 };
        }

        const resultadoEliminacion = await this.fincaRepo.delete(obj);
        return { caso: 2, resultadoEliminacion };
    }
}

export default ServiceFincaBorrar;