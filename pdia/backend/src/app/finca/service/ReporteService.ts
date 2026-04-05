import { AppError } from "../../../middleware/AppError";
import type { ReporteActividadesDto } from "../model/dto/ReporteDto";
import { ReporteRepository } from "../repository/ReporteRepository";

export class ReporteService {
    private repository: ReporteRepository;

    constructor() {
        this.repository = new ReporteRepository();
    }

    public async reporteActividades(cultivoId: number, userId: number): Promise<ReporteActividadesDto> {
        const permitido = await this.repository.cultivoBelongsToProductor(cultivoId, userId);
        if (!permitido) {
            throw new AppError("El cultivo no existe o no pertenece al productor", 404);
        }

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

    public async generarCsvActividades(cultivoId: number, userId: number): Promise<string> {
        const permitido = await this.repository.cultivoBelongsToProductor(cultivoId, userId);
        if (!permitido) {
            throw new AppError("El cultivo no existe o no pertenece al productor", 404);
        }

        const rows = await this.repository.getRawActivities(cultivoId);
        const header = "id,tipo,fecha,descripcion,datos";
        const body = rows.map((row) => {
            const descripcion = this.escapeCsv(row.descripcion);
            const datos = this.escapeCsv(JSON.stringify(row.datos ?? {}));
            return `${row.id},${row.tipo},${row.fecha},${descripcion},${datos}`;
        });

        return [header, ...body].join("\n");
    }

    public async reporteRiegos(cultivoId: number, userId: number): Promise<ReporteActividadesDto> {
        return this.reportePorTipo(cultivoId, userId, "RIEGO");
    }

    public async reporteFertilizaciones(cultivoId: number, userId: number): Promise<ReporteActividadesDto> {
        return this.reportePorTipo(cultivoId, userId, "FERTILIZACION");
    }

    private async reportePorTipo(cultivoId: number, userId: number, tipo: string): Promise<ReporteActividadesDto> {
        const permitido = await this.repository.cultivoBelongsToProductor(cultivoId, userId);
        if (!permitido) {
            throw new AppError("El cultivo no existe o no pertenece al productor", 404);
        }

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

    private escapeCsv(value: string): string {
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
    }
}
