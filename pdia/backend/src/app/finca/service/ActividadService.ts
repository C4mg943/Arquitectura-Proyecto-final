import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";
import type { Actividad } from "../model/Actividad";
import type { ActividadResponseDto, CreateActividadDto, UpdateActividadDto } from "../model/dto/ActividadDto";
import { ActividadRepository } from "../repository/ActividadRepository";

export class ActividadService {
    private repository: ActividadRepository;

    constructor() {
        this.repository = new ActividadRepository();
    }

    public async create(userId: number, rol: string, payload: CreateActividadDto): Promise<ActividadResponseDto> {
        const cultivoAccess = await this.repository.findCultivoAccess(payload.cultivoId);
        if (!cultivoAccess) {
            throw new AppError("El cultivo no existe", 404);
        }

        if (rol === UserRoles.PRODUCTOR) {
            if (cultivoAccess.propietarioId !== userId) {
                throw new AppError("El cultivo no existe o no pertenece al productor", 404);
            }
        } else if (rol === UserRoles.OPERARIO) {
            const asignado = await this.repository.operarioTieneAsignacion(userId, cultivoAccess.parcelaId);
            if (!asignado) {
                throw new AppError("No tienes acceso a la parcela de este cultivo", 403);
            }
        } else {
            throw new AppError("Rol no autorizado para registrar actividades", 403);
        }

        const actividad = await this.repository.create(userId, payload);
        return this.toDto(actividad);
    }

    public async list(userId: number, rol: string): Promise<ActividadResponseDto[]> {
        let actividades: Actividad[] = [];

        if (rol === UserRoles.PRODUCTOR) {
            actividades = await this.repository.listByPropietario(userId);
        } else if (rol === UserRoles.OPERARIO) {
            actividades = await this.repository.listByOperario(userId);
        }

        return actividades.map((actividad) => this.toDto(actividad));
    }

    public async listByCultivo(cultivoId: number, userId: number, rol: string): Promise<ActividadResponseDto[]> {
        let actividades: Actividad[] = [];

        if (rol === UserRoles.PRODUCTOR) {
            actividades = await this.repository.listByCultivoPropietario(cultivoId, userId);
        } else if (rol === UserRoles.OPERARIO) {
            actividades = await this.repository.listByCultivoOperario(cultivoId, userId);
        }

        return actividades.map((actividad) => this.toDto(actividad));
    }

    public async findOne(id: number, userId: number, rol: string): Promise<ActividadResponseDto> {
        const actividad = rol === UserRoles.OPERARIO
            ? await this.repository.findByIdAndOperario(id, userId)
            : await this.repository.findByIdAndPropietario(id, userId);

        if (!actividad) {
            throw new AppError("Actividad no encontrada", 404);
        }

        return this.toDto(actividad);
    }

    public async update(id: number, userId: number, rol: string, payload: UpdateActividadDto): Promise<ActividadResponseDto> {
        const actividad = rol === UserRoles.OPERARIO
            ? await this.repository.updateByOperario(id, userId, payload)
            : await this.repository.updateByPropietario(id, userId, payload);

        if (!actividad) {
            throw new AppError("Actividad no encontrada", 404);
        }

        return this.toDto(actividad);
    }

    public async delete(id: number, userId: number, rol: string): Promise<void> {
        const deleted = rol === UserRoles.OPERARIO
            ? await this.repository.deleteByOperario(id, userId)
            : await this.repository.deleteByPropietario(id, userId);

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
