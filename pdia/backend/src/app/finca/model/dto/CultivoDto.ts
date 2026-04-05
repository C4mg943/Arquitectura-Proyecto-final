import { CultivoEstado } from "../Cultivo";

export interface CreateCultivoDto {
    tipoCultivo: string;
    fechaSiembra: string;
    estado: CultivoEstado;
    observaciones?: string;
    parcelaId: number;
}

export interface UpdateCultivoDto {
    tipoCultivo?: string;
    fechaSiembra?: string;
    estado?: CultivoEstado;
    observaciones?: string;
}

export interface CultivoResponseDto {
    id: number;
    tipoCultivo: string;
    fechaSiembra: string;
    estado: CultivoEstado;
    observaciones: string | null;
    parcelaId: number;
}
