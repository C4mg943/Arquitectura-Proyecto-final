import bcrypt from "bcryptjs";
import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";
import type { PublicUserDto } from "../model/dto/AuthDto";
import { AsignacionOperarioResponseDto, OperarioConParcelasDto, RegisterOperarioDto } from "../model/dto/OperarioDto";
import { AsignacionOperarioRepository } from "../repository/AsignacionOperarioRepository";
import { AuthRepository } from "../repository/AuthRepository";

export class OperarioService {
    private readonly asignacionRepository: AsignacionOperarioRepository;
    private readonly authRepository: AuthRepository;

    constructor() {
        this.asignacionRepository = new AsignacionOperarioRepository();
        this.authRepository = new AuthRepository();
    }

    public async registerOperario(productorId: number, rol: string, payload: RegisterOperarioDto): Promise<PublicUserDto> {
        this.ensureProductor(rol);

        const existing = await this.authRepository.findByEmail(payload.email);
        if (existing) {
            throw new AppError("El correo ya está registrado", 409);
        }

        const passwordHash = await bcrypt.hash(payload.password, 10);
        const user = await this.authRepository.create({
            nombre: payload.nombre,
            identificacion: payload.identificacion,
            email: payload.email,
            passwordHash,
            rol: UserRoles.OPERARIO,
            productorId
        });

        return {
            id: user.getId(),
            nombre: user.getNombre(),
            identificacion: user.getIdentificacion(),
            email: user.getEmail(),
            rol: user.getRol(),
            productorId: user.getProductorId()
        };
    }

    public async asignarAParcela(
        productorId: number,
        rol: string,
        operarioId: number,
        parcelaId: number
    ): Promise<AsignacionOperarioResponseDto> {
        this.ensureProductor(rol);

        const operarioEsDelProductor = await this.asignacionRepository.operarioPerteneceAProductor(operarioId, productorId);
        if (!operarioEsDelProductor) {
            throw new AppError("El operario no existe o no pertenece al productor", 404);
        }

        const parcelaEsDelProductor = await this.asignacionRepository.parcelaPerteneceAProductor(parcelaId, productorId);
        if (!parcelaEsDelProductor) {
            throw new AppError("La parcela no existe o no pertenece al productor", 404);
        }

        const fincaIdParcela = await this.asignacionRepository.findFincaIdByParcela(parcelaId);
        if (!fincaIdParcela) {
            throw new AppError("La parcela no existe", 404);
        }

        const fincaIdsAsignadas = await this.asignacionRepository.listAssignedFincaIdsByOperario(operarioId);
        const fincaDistinta = fincaIdsAsignadas.some((fincaId) => fincaId !== fincaIdParcela);
        if (fincaDistinta) {
            throw new AppError("El operario solo puede ser asignado a parcelas dentro de la misma finca", 409);
        }

        const asignacionExistente = await this.asignacionRepository.existsAsignacion(operarioId, parcelaId);
        if (asignacionExistente) {
            throw new AppError("El operario ya está asignado a esta parcela", 409);
        }

        const asignacion = await this.asignacionRepository.asignar(operarioId, parcelaId, productorId);
        return {
            id: asignacion.getId(),
            operarioId: asignacion.getOperarioId(),
            parcelaId: asignacion.getParcelaId(),
            asignadoPorId: asignacion.getAsignadoPorId(),
            fechaAsignacion: asignacion.getFechaAsignacion().toISOString()
        };
    }

    public async desasignarDeParcela(productorId: number, rol: string, operarioId: number, parcelaId: number): Promise<void> {
        this.ensureProductor(rol);

        const operarioEsDelProductor = await this.asignacionRepository.operarioPerteneceAProductor(operarioId, productorId);
        if (!operarioEsDelProductor) {
            throw new AppError("El operario no existe o no pertenece al productor", 404);
        }

        const parcelaEsDelProductor = await this.asignacionRepository.parcelaPerteneceAProductor(parcelaId, productorId);
        if (!parcelaEsDelProductor) {
            throw new AppError("La parcela no existe o no pertenece al productor", 404);
        }

        const deleted = await this.asignacionRepository.desasignar(operarioId, parcelaId);
        if (!deleted) {
            throw new AppError("La asignación no existe", 404);
        }
    }

    public async listarOperariosConParcelas(productorId: number, rol: string): Promise<OperarioConParcelasDto[]> {
        this.ensureProductor(rol);

        const rows = await this.asignacionRepository.listOperariosConParcelas(productorId);
        const grouped = new Map<number, OperarioConParcelasDto>();

        rows.forEach((row) => {
            const existing = grouped.get(row.operarioId);
            if (!existing) {
                grouped.set(row.operarioId, {
                    operario: {
                        id: row.operarioId,
                        nombre: row.operarioNombre,
                        identificacion: row.operarioIdentificacion,
                        email: row.operarioEmail,
                        rol: row.operarioRol,
                        productorId
                    },
                    parcelas: row.parcelaId
                        ? [{
                            id: row.parcelaId,
                            nombre: row.parcelaNombre ?? "",
                            municipio: row.parcelaMunicipio ?? "",
                            hectareas: Number(row.parcelaHectareas ?? 0),
                            fincaId: row.fincaId ?? 0
                        }]
                        : []
                });
                return;
            }

            if (row.parcelaId) {
                existing.parcelas.push({
                    id: row.parcelaId,
                    nombre: row.parcelaNombre ?? "",
                    municipio: row.parcelaMunicipio ?? "",
                    hectareas: Number(row.parcelaHectareas ?? 0),
                    fincaId: row.fincaId ?? 0
                });
            }
        });

        return Array.from(grouped.values());
    }

    private ensureProductor(rol: string): void {
        if (rol !== UserRoles.PRODUCTOR) {
            throw new AppError("Solo los productores pueden gestionar operarios", 403);
        }
    }
}
