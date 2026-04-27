export enum TipoRecomendacion { RIEGO = "RIEGO", FERTILIZACION = "FERTILIZACION", FITORECOMENDACION = "FITORECOMENDACION" }

export class Recomendacion {
  private data: { id: number; tipo: TipoRecomendacion; descripcion: string; fecha: Date; cultivoId: number; };
  constructor(data: any) { this.data = { id: data.id, tipo: data.tipo, descripcion: data.descripcion, fecha: data.fecha, cultivoId: data.cultivo_id }; }
  getId(): number { return this.data.id; }
  getTipo(): TipoRecomendacion { return this.data.tipo; }
  getDescripcion(): string { return this.data.descripcion; }
  getCultivoId(): number { return this.data.cultivoId; }
  toJson() { return { id: this.data.id, tipo: this.data.tipo, descripcion: this.data.descripcion, fecha: this.data.fecha.toISOString().split("T")[0], cultivoId: this.data.cultivoId }; }
}