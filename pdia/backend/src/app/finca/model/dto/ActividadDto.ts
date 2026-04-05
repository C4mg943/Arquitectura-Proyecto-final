import { ActividadTipo } from "../Actividad";

export interface CreateActividadDto {
    tipo: ActividadTipo;
    fecha: string;
    descripcion: string;
    datos?: Record<string, unknown>;
    cultivoId: number;
}

export interface UpdateActividadDto {
    tipo?: ActividadTipo;
    fecha?: string;
    descripcion?: string;
    datos?: Record<string, unknown>;
}

export interface ActividadResponseDto {
    id: number;
    tipo: ActividadTipo;
    fecha: string;
    descripcion: string;
    datos: Record<string, unknown> | null;
    cultivoId: number;
    creadoPorId: number;
}
