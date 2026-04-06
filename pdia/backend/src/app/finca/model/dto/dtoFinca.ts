export interface FincaResponseDto {
    id: number;
    nombre: string;
    municipio: string;
    departamento: string;
    productor_id: number;
    productor_nombre: string;
    area_hectareas: number;
    codigo_ica: string;
    created_at: Date;
}
export interface FincaCreateDto {
    nombre: string;
    municipio: string;
    departamento: string;
    productorId: number;
    area_hectareas: number;
    codigo_ica: string;
}
export interface FincaUpdateDto {
    id: number;
    nombre: string;
    municipio: string;
    departamento: string;
    productorId: number;
    area_hectareas: number;
    codigo_ica: string;
}
export interface FincaIdDto {
    id: number;
}