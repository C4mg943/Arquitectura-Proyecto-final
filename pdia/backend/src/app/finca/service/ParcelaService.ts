import { AppError } from "../../../middleware/AppError";
import { Parcela } from "../model/Parcela";
import { CreateParcelaDto, ParcelaResponseDto, UpdateParcelaDto } from "../model/dto/ParcelaDto";
import { ParcelaRepository } from "../repository/ParcelaRepository";

export class ParcelaService {
    private repository: ParcelaRepository;

    constructor() {
        this.repository = new ParcelaRepository();
    }

    public async create(productorId: number, payload: CreateParcelaDto): Promise<ParcelaResponseDto> {
        const parcela = await this.repository.create(productorId, payload);
        return this.toDto(parcela);
    }

    public async list(productorId: number): Promise<ParcelaResponseDto[]> {
        const parcelas = await this.repository.listByProductor(productorId);
        return parcelas.map((parcela) => this.toDto(parcela));
    }

    public async findOne(id: number, productorId: number): Promise<ParcelaResponseDto> {
        const parcela = await this.repository.findByIdAndProductor(id, productorId);
        if (!parcela) {
            throw new AppError("Parcela no encontrada", 404);
        }
        return this.toDto(parcela);
    }

    public async update(id: number, productorId: number, payload: UpdateParcelaDto): Promise<ParcelaResponseDto> {
        const parcela = await this.repository.update(id, productorId, payload);
        if (!parcela) {
            throw new AppError("Parcela no encontrada", 404);
        }
        return this.toDto(parcela);
    }

    public async delete(id: number, productorId: number): Promise<void> {
        const deleted = await this.repository.delete(id, productorId);
        if (!deleted) {
            throw new AppError("Parcela no encontrada", 404);
        }
    }

    private toDto(parcela: Parcela): ParcelaResponseDto {
        return {
            id: parcela.getId(),
            nombre: parcela.getNombre(),
            municipio: parcela.getMunicipio(),
            hectareas: parcela.getHectareas(),
            latitud: parcela.getLatitud(),
            longitud: parcela.getLongitud(),
            productorId: parcela.getProductorId()
        };
    }
}
