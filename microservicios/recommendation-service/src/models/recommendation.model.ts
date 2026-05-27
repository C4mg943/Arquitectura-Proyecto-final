export enum TipoRecomendacion { RIEGO = "RIEGO", FERTILIZACION = "FERTILIZACION", FITORECOMENDACION = "FITORECOMENDACION" }
export enum OrigenRecomendacion { SISTEMA = "SISTEMA", TECNICO = "TECNICO" }

export class Recomendacion {
  private data: { id: number; tipo: TipoRecomendacion; descripcion: string; fecha: Date; cultivoId: number; origen: OrigenRecomendacion; };
  constructor(data: any) {
    this.data = {
      id: data.id,
      tipo: data.tipo,
      descripcion: data.descripcion,
      fecha: data.fecha,
      cultivoId: data.cultivo_id,
      origen: (data.origen as OrigenRecomendacion) ?? OrigenRecomendacion.TECNICO,
    };
  }
  getId(): number { return this.data.id; }
  getTipo(): TipoRecomendacion { return this.data.tipo; }
  getDescripcion(): string { return this.data.descripcion; }
  getCultivoId(): number { return this.data.cultivoId; }
  getOrigen(): OrigenRecomendacion { return this.data.origen; }
  toJson() {
    return {
      id: this.data.id,
      tipo: this.data.tipo,
      descripcion: this.data.descripcion,
      fecha: this.data.fecha instanceof Date
        ? this.data.fecha.toISOString().split("T")[0]
        : String(this.data.fecha).split("T")[0],
      cultivoId: this.data.cultivoId,
      origen: this.data.origen,
    };
  }
}