export interface CreateParcelaDto {
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
    fincaId: number;
}

export interface UpdateParcelaDto {
    nombre?: string;
    municipio?: string;
    hectareas?: number;
    latitud?: number;
    longitud?: number;
    fincaId?: number;
}

export interface ParcelaResponseDto {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
    fincaId: number;
}
