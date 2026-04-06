import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";
import { Parcela } from "../model/Parcela";
import { CreateParcelaDto, ParcelaResponseDto, UpdateParcelaDto } from "../model/dto/ParcelaDto";
import { AsignacionOperarioRepository } from "../repository/AsignacionOperarioRepository";
import { ParcelaRepository } from "../repository/ParcelaRepository";

export class ParcelaService {
    private repository: ParcelaRepository;
    private readonly asignacionRepository: AsignacionOperarioRepository;

    constructor() {
        this.repository = new ParcelaRepository();
        this.asignacionRepository = new AsignacionOperarioRepository();
    }

    public async create(userId: number, rol: string, payload: CreateParcelaDto): Promise<ParcelaResponseDto> {
        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Solo los productores pueden crear parcelas", 403);
        }

        const fincaValida = await this.repository.fincaBelongsToPropietario(payload.fincaId, userId);
        if (!fincaValida) {
            throw new AppError("La finca no existe o no pertenece al productor", 404);
        }

        const parcela = await this.repository.create(payload);
        return this.toDto(parcela);
    }

    public async list(userId: number, rol: string): Promise<ParcelaResponseDto[]> {
        if (rol === UserRoles.PRODUCTOR) {
            const parcelas = await this.repository.listByPropietario(userId);
            return parcelas.map((parcela) => this.toDto(parcela));
        }

        if (rol === UserRoles.OPERARIO) {
            const parcelas = await this.repository.listByOperario(userId);
            return parcelas.map((parcela) => this.toDto(parcela));
        }

        return [];
    }

    public async findOne(id: number, userId: number, rol: string): Promise<ParcelaResponseDto> {
        let parcela: Parcela | null = null;

        if (rol === UserRoles.PRODUCTOR) {
            parcela = await this.repository.findByIdAndPropietario(id, userId);
        } else if (rol === UserRoles.OPERARIO) {
            parcela = await this.repository.findByIdAndOperario(id, userId);
        }

        if (!parcela) {
            throw new AppError("Parcela no encontrada", 404);
        }
        return this.toDto(parcela);
    }

    public async update(id: number, userId: number, rol: string, payload: UpdateParcelaDto): Promise<ParcelaResponseDto> {
        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Solo los productores pueden actualizar parcelas", 403);
        }

        if (payload.fincaId !== undefined) {
            const fincaValida = await this.repository.fincaBelongsToPropietario(payload.fincaId, userId);
            if (!fincaValida) {
                throw new AppError("La finca no existe o no pertenece al productor", 404);
            }
        }

        const parcela = await this.repository.updateByPropietario(id, userId, payload);
        if (!parcela) {
            throw new AppError("Parcela no encontrada", 404);
        }
        return this.toDto(parcela);
    }

    public async delete(id: number, userId: number, rol: string): Promise<void> {
        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Solo los productores pueden eliminar parcelas", 403);
        }

        const deleted = await this.repository.deleteByPropietario(id, userId);
        if (!deleted) {
            throw new AppError("Parcela no encontrada", 404);
        }
    }

    public async operarioPuedeAccederParcela(operarioId: number, parcelaId: number): Promise<boolean> {
        return this.asignacionRepository.existsAsignacion(operarioId, parcelaId);
    }

    private toDto(parcela: Parcela): ParcelaResponseDto {
        return {
            id: parcela.getId(),
            nombre: parcela.getNombre(),
            municipio: parcela.getMunicipio(),
            hectareas: parcela.getHectareas(),
            latitud: parcela.getLatitud(),
            longitud: parcela.getLongitud(),
            fincaId: parcela.getFincaId()
        };
    }
}
