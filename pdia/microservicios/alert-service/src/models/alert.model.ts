export enum TipoAlerta {
  LLUVIA = "LLUVIA",
  TEMPERATURA_ALTA = "TEMPERATURA_ALTA",
  TEMPERATURA_BAJA = "TEMPERATURA_BAJA",
  VIENTO = "VIENTO",
}

export class Alerta {
  private data: { id: number; tipo: TipoAlerta; valorDetectado: number; fecha: Date; cultivoId: number; leida: boolean; };

  constructor(data: any) {
    this.data = { id: data.id, tipo: data.tipo, valorDetectado: data.valor_detectado, fecha: data.fecha, cultivoId: data.cultivo_id, leida: data.leida };
  }

  getId(): number { return this.data.id; }
  getTipo(): TipoAlerta { return this.data.tipo; }
  getValorDetectado(): number { return this.data.valorDetectado; }
  getCultivoId(): number { return this.data.cultivoId; }
  getLeida(): boolean { return this.data.leida; }

  toJson() {
    return { id: this.data.id, tipo: this.data.tipo, valorDetectado: this.data.valorDetectado, fecha: this.data.fecha.toISOString().split("T")[0], cultivoId: this.data.cultivoId, leida: this.data.leida };
  }
}