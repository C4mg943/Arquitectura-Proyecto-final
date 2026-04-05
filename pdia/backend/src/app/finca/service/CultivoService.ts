import { AppError } from "../../../middleware/AppError";
import { Cultivo } from "../model/Cultivo";
import { CreateCultivoDto, CultivoResponseDto, UpdateCultivoDto } from "../model/dto/CultivoDto";
import { CultivoRepository } from "../repository/CultivoRepository";

export class CultivoService {
    private repository: CultivoRepository;

    constructor() {
        this.repository = new CultivoRepository();
    }

    public async create(productorId: number, payload: CreateCultivoDto): Promise<CultivoResponseDto> {
        const parcelaValida = await this.repository.parcelaBelongsToProductor(payload.parcelaId, productorId);
        if (!parcelaValida) {
            throw new AppError("La parcela no existe o no pertenece al productor", 404);
        }
        const cultivo = await this.repository.create(payload);
        return this.toDto(cultivo);
    }

    public async list(productorId: number, tipoCultivo?: string): Promise<CultivoResponseDto[]> {
        const cultivos = tipoCultivo
            ? await this.repository.searchByTipo(productorId, tipoCultivo)
            : await this.repository.listByProductor(productorId);
        return cultivos.map((cultivo) => this.toDto(cultivo));
    }

    public async findOne(id: number, productorId: number): Promise<CultivoResponseDto> {
        const cultivo = await this.repository.findByIdAndProductor(id, productorId);
        if (!cultivo) {
            throw new AppError("Cultivo no encontrado", 404);
        }
        return this.toDto(cultivo);
    }

    public async update(id: number, productorId: number, payload: UpdateCultivoDto): Promise<CultivoResponseDto> {
        const cultivo = await this.repository.update(id, productorId, payload);
        if (!cultivo) {
            throw new AppError("Cultivo no encontrado", 404);
        }
        return this.toDto(cultivo);
    }

    public async delete(id: number, productorId: number): Promise<void> {
        const deleted = await this.repository.delete(id, productorId);
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
