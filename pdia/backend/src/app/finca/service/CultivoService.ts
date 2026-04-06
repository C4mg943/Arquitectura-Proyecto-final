import { AppError } from "../../../middleware/AppError";
import { Cultivo } from "../model/Cultivo";
import { UserRoles } from "../model/User";
import { CreateCultivoDto, CultivoResponseDto, UpdateCultivoDto } from "../model/dto/CultivoDto";
import { CultivoRepository } from "../repository/CultivoRepository";

export class CultivoService {
    private repository: CultivoRepository;

    constructor() {
        this.repository = new CultivoRepository();
    }

    public async create(userId: number, rol: string, payload: CreateCultivoDto): Promise<CultivoResponseDto> {
        const ownership = await this.repository.findParcelaOwnership(payload.parcelaId);
        if (!ownership) {
            throw new AppError("La parcela no existe", 404);
        }

        if (rol === UserRoles.PRODUCTOR) {
            if (ownership.propietarioId !== userId) {
                throw new AppError("La parcela no existe o no pertenece al productor", 404);
            }
        } else if (rol === UserRoles.OPERARIO) {
            throw new AppError("Los operarios no pueden crear cultivos", 403);
        } else {
            throw new AppError("Rol no autorizado para crear cultivos", 403);
        }

        const cultivo = await this.repository.create(payload);
        return this.toDto(cultivo);
    }

    public async list(userId: number, rol: string, tipoCultivo?: string): Promise<CultivoResponseDto[]> {
        let cultivos: Cultivo[] = [];

        if (rol === UserRoles.PRODUCTOR) {
            cultivos = tipoCultivo
                ? await this.repository.searchByTipoPropietario(userId, tipoCultivo)
                : await this.repository.listByPropietario(userId);
        } else if (rol === UserRoles.OPERARIO) {
            cultivos = tipoCultivo
                ? await this.repository.searchByTipoOperario(userId, tipoCultivo)
                : await this.repository.listByOperario(userId);
        }

        return cultivos.map((cultivo) => this.toDto(cultivo));
    }

    public async findOne(id: number, userId: number, rol: string): Promise<CultivoResponseDto> {
        let cultivo: Cultivo | null = null;

        if (rol === UserRoles.PRODUCTOR) {
            cultivo = await this.repository.findByIdAndPropietario(id, userId);
        } else if (rol === UserRoles.OPERARIO) {
            cultivo = await this.repository.findByIdAndOperario(id, userId);
        }

        if (!cultivo) {
            throw new AppError("Cultivo no encontrado", 404);
        }
        return this.toDto(cultivo);
    }

    public async update(id: number, userId: number, rol: string, payload: UpdateCultivoDto): Promise<CultivoResponseDto> {
        if (rol === UserRoles.OPERARIO) {
            throw new AppError("Los operarios no pueden actualizar cultivos", 403);
        }

        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Rol no autorizado para actualizar cultivos", 403);
        }

        const cultivo = await this.repository.updateByPropietario(id, userId, payload);
        if (!cultivo) {
            throw new AppError("Cultivo no encontrado", 404);
        }
        return this.toDto(cultivo);
    }

    public async delete(id: number, userId: number, rol: string): Promise<void> {
        if (rol === UserRoles.OPERARIO) {
            throw new AppError("Los operarios no pueden eliminar cultivos", 403);
        }

        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Rol no autorizado para eliminar cultivos", 403);
        }

        const deleted = await this.repository.deleteByPropietario(id, userId);
        if (!deleted) {
            throw new AppError("Cultivo no encontrado", 404);
        }
    }

    private toDto(cultivo: Cultivo): CultivoResponseDto {
        return {
            id: cultivo.getId(),
            tipoCultivo: cultivo.getTipoCultivo(),
            fechaSiembra: cultivo.getFechaSiembra().toISOString().split("T")[0],
            estado: cultivo.getEstado(),
            observaciones: cultivo.getObservaciones(),
            parcelaId: cultivo.getParcelaId()
        };
    }
}
