export class Crop {
  id: number;
  tipoCultivo: string;
  estado: 'EN_CRECIMIENTO' | 'COSECHADO' | 'AFECTADO';
  observaciones?: string;

  constructor(id: number, tipoCultivo: string, estado: 'EN_CRECIMIENTO' | 'COSECHADO' | 'AFECTADO', observaciones?: string) {
    this.id = id;
    this.tipoCultivo = tipoCultivo;
    this.estado = estado;
    this.observaciones = observaciones;
  }
}
