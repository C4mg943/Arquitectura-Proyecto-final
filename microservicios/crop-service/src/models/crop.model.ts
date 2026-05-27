export enum EstadoCultivo {
  EN_CRECIMIENTO = "EN_CRECIMIENTO",
  COSECHADO = "COSECHADO",
  AFECTADO = "AFECTADO",
}

export class Cultivo {
  private data: {
    id: number;
    tipoCultivo: string;
    fechaSiembra: Date;
    estado: EstadoCultivo;
    observaciones: string | null;
    areaM2: number;
    parcelaId: number;
    createdAt: Date;
  };

  constructor(data: any) {
    this.data = {
      id: data.id,
      tipoCultivo: data.tipo_cultivo,
      fechaSiembra: data.fecha_siembra,
      estado: data.estado as EstadoCultivo,
      observaciones: data.observaciones,
      areaM2: data.area_m2 != null ? Number(data.area_m2) : 0,
      parcelaId: data.parcela_id,
      createdAt: data.created_at,
    };
  }

  getId(): number {
    return this.data.id;
  }
  getTipoCultivo(): string {
    return this.data.tipoCultivo;
  }
  getFechaSiembra(): Date {
    return this.data.fechaSiembra;
  }
  getEstado(): EstadoCultivo {
    return this.data.estado;
  }
  getParcelaId(): number {
    return this.data.parcelaId;
  }
  getAreaM2(): number {
    return this.data.areaM2;
  }

  toJson() {
    return {
      id: this.data.id,
      tipoCultivo: this.data.tipoCultivo,
      fechaSiembra: this.data.fechaSiembra.toISOString().split("T")[0],
      estado: this.data.estado,
      observaciones: this.data.observaciones,
      areaM2: this.data.areaM2,
      parcelaId: this.data.parcelaId,
    };
  }
}