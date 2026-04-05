import { AppError } from "../../../middleware/AppError";
import type { Actividad } from "../model/Actividad";
import type { ActividadResponseDto, CreateActividadDto, UpdateActividadDto } from "../model/dto/ActividadDto";
import { ActividadRepository } from "../repository/ActividadRepository";

export class ActividadService {
    private repository: ActividadRepository;

    constructor() {
        this.repository = new ActividadRepository();
    }

    public async create(userId: number, payload: CreateActividadDto): Promise<ActividadResponseDto> {
        const cultivoValido = await this.repository.cultivoBelongsToProductor(payload.cultivoId, userId);
        if (!cultivoValido) {
            throw new AppError("El cultivo no existe o no pertenece al productor", 404);
        }

        const actividad = await this.repository.create(userId, payload);
        return this.toDto(actividad);
    }

    public async list(userId: number): Promise<ActividadResponseDto[]> {
        const actividades = await this.repository.listByProductor(userId);
        return actividades.map((actividad) => this.toDto(actividad));
    }

    public async listByCultivo(cultivoId: number, userId: number): Promise<ActividadResponseDto[]> {
        const actividades = await this.repository.listByCultivo(cultivoId, userId);
        return actividades.map((actividad) => this.toDto(actividad));
    }

    public async findOne(id: number, userId: number): Promise<ActividadResponseDto> {
        const actividad = await this.repository.findByIdAndProductor(id, userId);
        if (!actividad) {
            throw new AppError("Actividad no encontrada", 404);
        }

        return this.toDto(actividad);
    }

    public async update(id: number, userId: number, payload: UpdateActividadDto): Promise<ActividadResponseDto> {
        const actividad = await this.repository.update(id, userId, payload);
        if (!actividad) {
            throw new AppError("Actividad no encontrada", 404);
        }

        return this.toDto(actividad);
    }

    public async delete(id: number, userId: number): Promise<void> {
        const deleted = await this.repository.delete(id, userId);
        if (!deleted) {
            throw new AppError("Actividad no encontrada", 404);
        }
    }

    private toDto(actividad: Actividad): ActividadResponseDto {
        return {
            id: actividad.getId(),
            tipo: actividad.getTipo(),
            fecha: actividad.getFecha().toISOString().split("T")[0],
            descripcion: actividad.getDescripcion(),
            datos: actividad.getDatos(),
            cultivoId: actividad.getCultivoId(),
            creadoPorId: actividad.getCreadoPorId()
        };
    }
}
