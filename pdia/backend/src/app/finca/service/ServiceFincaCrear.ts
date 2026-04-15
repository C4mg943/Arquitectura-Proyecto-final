import { IFincaRepository } from "../repository/IFincaRepository";
import { ImpFincaRepository } from "../repository/ImpFincaRepository";
import { FincaCreateDto } from "../model/dto/dtoFinca";

class ServicioFincaCrear {
    private static fincaRepo: IFincaRepository = new ImpFincaRepository();

    public static async grabarFinca(obj: FincaCreateDto): Promise<any> {
        const duplicados = await this.fincaRepo.checkDuplicate(
            obj.nombre,
            obj.municipio,
            obj.productorId
        );

        if (duplicados > 0) {
            return { caso: 1 }; // Nombre duplicado
        }

        const objGrabado = await this.fincaRepo.create(obj);
        return { caso: 2, objGrabado };
    }
}

export default ServicioFincaCrear;