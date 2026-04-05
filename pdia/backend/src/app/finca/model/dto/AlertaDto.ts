import { AlertaTipo } from "../Alerta";

export interface CreateAlertaDto {
    tipo: AlertaTipo;
    valorDetectado: number;
    fecha: string;
    cultivoId: number;
}

export interface AlertaResponseDto {
    id: number;
    tipo: AlertaTipo;
    valorDetectado: number;
    fecha: string;
    cultivoId: number;
    leida: boolean;
}
