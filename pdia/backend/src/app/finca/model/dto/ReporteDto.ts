export interface ReporteActividadesDto {
    cultivoId: number;
    totalActividades: number;
    porTipo: Record<string, number>;
    desde: string | null;
    hasta: string | null;
}
