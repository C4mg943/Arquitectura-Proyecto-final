import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";
import type { Alerta } from "../model/Alerta";
import type { AlertaResponseDto, CreateAlertaDto } from "../model/dto/AlertaDto";
import { AlertaRepository } from "../repository/AlertaRepository";

export class AlertaService {
    private repository: AlertaRepository;

    constructor() {
        this.repository = new AlertaRepository();
    }

    public async create(userId: number, rol: string, payload: CreateAlertaDto): Promise<AlertaResponseDto> {
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
            throw new AppError("Rol no autorizado para crear alertas", 403);
        }

        const alerta = await this.repository.create(payload);
        return this.toDto(alerta);
    }

    public async list(userId: number, rol: string): Promise<AlertaResponseDto[]> {
        const alertas = rol === UserRoles.OPERARIO
            ? await this.repository.listByOperario(userId)
            : await this.repository.listByPropietario(userId);
        return alertas.map((alerta) => this.toDto(alerta));
    }

    public async listByCultivo(cultivoId: number, userId: number, rol: string): Promise<AlertaResponseDto[]> {
        const alertas = rol === UserRoles.OPERARIO
            ? await this.repository.listByCultivoOperario(cultivoId, userId)
            : await this.repository.listByCultivoPropietario(cultivoId, userId);
        return alertas.map((alerta) => this.toDto(alerta));
    }

    public async findOne(id: number, userId: number, rol: string): Promise<AlertaResponseDto> {
        const alerta = rol === UserRoles.OPERARIO
            ? await this.repository.findByIdAndOperario(id, userId)
            : await this.repository.findByIdAndPropietario(id, userId);
        if (!alerta) {
            throw new AppError("Alerta no encontrada", 404);
        }

        return this.toDto(alerta);
    }

    public async delete(id: number, userId: number, rol: string): Promise<void> {
        if (rol === UserRoles.OPERARIO) {
            throw new AppError("Los operarios no pueden eliminar alertas", 403);
        }

        const deleted = await this.repository.deleteByPropietario(id, userId);
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
