export interface FincaResponseDto {
    id: number;
    nombre: string;
    municipio: string;
    departamento: string;
    productor_id: number;
    productor_nombre: string;
    created_at: Date;
}
export interface FincaCreateDto {
    nombre: string;
    municipio: string;
    departamento: string;
    productorId: number;
}
export interface FincaUpdateDto {
    id: number;
    nombre: string;
    municipio: string;
    departamento: string;
    productorId: number;
}
export interface FincaIdDto {
    id: number;
}