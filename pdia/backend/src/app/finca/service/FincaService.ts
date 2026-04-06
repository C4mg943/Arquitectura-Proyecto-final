import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";
import { CreateFincaDto, FincaResponseDto, UpdateFincaDto } from "../model/dto/FincaDto";
import { Finca } from "../model/Finca";
import { FincaRepository } from "../repository/FincaRepository";

export class FincaService {
    private repository: FincaRepository;

    constructor() {
        this.repository = new FincaRepository();
    }

    public async create(propietarioId: number, rol: string, payload: CreateFincaDto): Promise<FincaResponseDto> {
        this.ensureProductor(rol);
        const finca = await this.repository.create(propietarioId, payload);
        return this.toDto(finca);
    }

    public async list(propietarioId: number, rol: string): Promise<FincaResponseDto[]> {
        this.ensureProductor(rol);
        const fincas = await this.repository.listByPropietario(propietarioId);
        return fincas.map((finca) => this.toDto(finca));
    }

    public async findOne(id: number, propietarioId: number, rol: string): Promise<FincaResponseDto> {
        this.ensureProductor(rol);
        const finca = await this.repository.findByIdAndPropietario(id, propietarioId);
        if (!finca) {
            throw new AppError("Finca no encontrada", 404);
        }
        return this.toDto(finca);
    }

    public async update(id: number, propietarioId: number, rol: string, payload: UpdateFincaDto): Promise<FincaResponseDto> {
        this.ensureProductor(rol);
        const finca = await this.repository.update(id, propietarioId, payload);
        if (!finca) {
            throw new AppError("Finca no encontrada", 404);
        }
        return this.toDto(finca);
    }

    public async delete(id: number, propietarioId: number, rol: string): Promise<void> {
        this.ensureProductor(rol);
        const deleted = await this.repository.delete(id, propietarioId);
        if (!deleted) {
            throw new AppError("Finca no encontrada", 404);
        }
    }

    private ensureProductor(rol: string): void {
        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Solo los productores pueden gestionar fincas", 403);
        }
    }

    private toDto(finca: Finca): FincaResponseDto {
        return {
            id: finca.getId(),
            nombre: finca.getNombre(),
            ubicacion: finca.getUbicacion(),
            descripcion: finca.getDescripcion(),
            area: finca.getArea(),
            tipoFinca: finca.getTipoFinca(),
            fechaRegistro: finca.getFechaRegistro().toISOString().split("T")[0],
            codigoIcaInvima: finca.getCodigoIcaInvima(),
            propietarioId: finca.getPropietarioId()
        };
    }
}
