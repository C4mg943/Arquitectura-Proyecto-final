import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";
import type { ReporteActividadesDto } from "../model/dto/ReporteDto";
import { ReporteRepository } from "../repository/ReporteRepository";

export class ReporteService {
    private repository: ReporteRepository;

    constructor() {
        this.repository = new ReporteRepository();
    }

    public async reporteActividades(cultivoId: number, userId: number, rol: string): Promise<ReporteActividadesDto> {
        await this.ensureCultivoAccess(cultivoId, userId, rol);

        const porTipo = await this.repository.aggregateByTipo(cultivoId);
        const rango = await this.repository.getDateRange(cultivoId);
        const totalActividades = Object.values(porTipo).reduce((sum, count) => sum + count, 0);

        return {
            cultivoId,
            totalActividades,
            porTipo,
            desde: rango.desde,
            hasta: rango.hasta
        };
    }

    public async generarCsvActividades(cultivoId: number, userId: number, rol: string): Promise<string> {
        await this.ensureCultivoAccess(cultivoId, userId, rol);

        const rows = await this.repository.getRawActivities(cultivoId);
        const header = "id,tipo,fecha,descripcion,datos";
        const body = rows.map((row) => {
            const descripcion = this.escapeCsv(row.descripcion);
            const datos = this.escapeCsv(JSON.stringify(row.datos ?? {}));
            return `${row.id},${row.tipo},${row.fecha},${descripcion},${datos}`;
        });

        return [header, ...body].join("\n");
    }

    public async reporteRiegos(cultivoId: number, userId: number, rol: string): Promise<ReporteActividadesDto> {
        return this.reportePorTipo(cultivoId, userId, rol, "RIEGO");
    }

    public async reporteFertilizaciones(cultivoId: number, userId: number, rol: string): Promise<ReporteActividadesDto> {
        return this.reportePorTipo(cultivoId, userId, rol, "FERTILIZACION");
    }

    private async reportePorTipo(cultivoId: number, userId: number, rol: string, tipo: string): Promise<ReporteActividadesDto> {
        await this.ensureCultivoAccess(cultivoId, userId, rol);

        const rows = await this.repository.getRawActivities(cultivoId, tipo);
        const fechas = rows.map((row) => row.fecha);

        return {
            cultivoId,
            totalActividades: rows.length,
            porTipo: { [tipo]: rows.length },
            desde: fechas.length > 0 ? fechas[fechas.length - 1] : null,
            hasta: fechas.length > 0 ? fechas[0] : null
        };
    }

    private async ensureCultivoAccess(cultivoId: number, userId: number, rol: string): Promise<void> {
        const access = await this.repository.findCultivoAccess(cultivoId);
        if (!access) {
            throw new AppError("El cultivo no existe", 404);
        }

        if (rol === UserRoles.PRODUCTOR) {
            if (access.propietarioId !== userId) {
                throw new AppError("El cultivo no existe o no pertenece al productor", 404);
            }
            return;
        }

        if (rol === UserRoles.OPERARIO) {
            const asignado = await this.repository.operarioTieneAsignacion(userId, access.parcelaId);
            if (!asignado) {
                throw new AppError("No tienes acceso a la parcela de este cultivo", 403);
            }
            return;
        }

        throw new AppError("Rol no autorizado para generar reportes", 403);
    }

    private escapeCsv(value: string): string {
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
    }
}
