import type { TipoFinca } from "../Finca";

export interface CreateFincaDto {
    nombre: string;
    ubicacion: string;
    descripcion?: string;
    area: number;
    tipoFinca: TipoFinca;
    fechaRegistro?: string;
    codigoIcaInvima?: string;
}

export interface UpdateFincaDto {
    nombre?: string;
    ubicacion?: string;
    descripcion?: string;
    area?: number;
    tipoFinca?: TipoFinca;
    fechaRegistro?: string;
    codigoIcaInvima?: string;
}

export interface FincaResponseDto {
    id: number;
    nombre: string;
    ubicacion: string;
    descripcion: string | null;
    area: number;
    tipoFinca: TipoFinca;
    fechaRegistro: string;
    codigoIcaInvima: string | null;
    propietarioId: number;
}
