import { AppError } from "../../../middleware/AppError";
import type { Alerta } from "../model/Alerta";
import type { AlertaResponseDto, CreateAlertaDto } from "../model/dto/AlertaDto";
import { AlertaRepository } from "../repository/AlertaRepository";

export class AlertaService {
    private repository: AlertaRepository;

    constructor() {
        this.repository = new AlertaRepository();
    }

    public async create(userId: number, payload: CreateAlertaDto): Promise<AlertaResponseDto> {
        const cultivoValido = await this.repository.cultivoBelongsToProductor(payload.cultivoId, userId);
        if (!cultivoValido) {
            throw new AppError("El cultivo no existe o no pertenece al productor", 404);
        }

        const alerta = await this.repository.create(payload);
        return this.toDto(alerta);
    }

    public async list(userId: number): Promise<AlertaResponseDto[]> {
        const alertas = await this.repository.listByProductor(userId);
        return alertas.map((alerta) => this.toDto(alerta));
    }

    public async listByCultivo(cultivoId: number, userId: number): Promise<AlertaResponseDto[]> {
        const alertas = await this.repository.listByCultivo(cultivoId, userId);
        return alertas.map((alerta) => this.toDto(alerta));
    }

    public async findOne(id: number, userId: number): Promise<AlertaResponseDto> {
        const alerta = await this.repository.findByIdAndProductor(id, userId);
        if (!alerta) {
            throw new AppError("Alerta no encontrada", 404);
        }

        return this.toDto(alerta);
    }

    public async delete(id: number, userId: number): Promise<void> {
        const deleted = await this.repository.delete(id, userId);
        if (!deleted) {
            throw new AppError("Alerta no encontrada", 404);
        }
    }

    private toDto(alerta: Alerta): AlertaResponseDto {
        return {
            id: alerta.getId(),
            tipo: alerta.getTipo(),
            valorDetectado: alerta.getValorDetectado(),
            fecha: alerta.getFecha().toISOString().split("T")[0],
            cultivoId: alerta.getCultivoId(),
            leida: alerta.getLeida()
        };
    }
}
