export interface CreateParcelaDto {
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
}

export interface UpdateParcelaDto {
    nombre?: string;
    municipio?: string;
    hectareas?: number;
    latitud?: number;
    longitud?: number;
}

export interface ParcelaResponseDto {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
    productorId: number;
}
