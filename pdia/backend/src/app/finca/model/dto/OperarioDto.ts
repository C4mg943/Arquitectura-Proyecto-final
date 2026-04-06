import type { PublicUserDto } from "./AuthDto";

export interface RegisterOperarioDto {
    nombre: string;
    identificacion: string;
    email: string;
    password: string;
}

export interface AsignarOperarioDto {
    operarioId: number;
    parcelaId: number;
}

export interface ParcelaAsignadaDto {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: number;
    fincaId: number;
}

export interface OperarioConParcelasDto {
    operario: PublicUserDto;
    parcelas: ParcelaAsignadaDto[];
}

export interface AsignacionOperarioResponseDto {
    id: number;
    operarioId: number;
    parcelaId: number;
    asignadoPorId: number;
    fechaAsignacion: string;
}
