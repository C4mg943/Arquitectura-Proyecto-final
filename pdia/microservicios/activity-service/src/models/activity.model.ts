export enum TipoActividad {
  RIEGO = "RIEGO",
  FERTILIZACION = "FERTILIZACION",
  PLAGA = "PLAGA",
  OBSERVACION = "OBSERVACION",
}

export class Actividad {
  private data: {
    id: number;
    tipo: TipoActividad;
    fecha: Date;
    descripcion: string;
    datos: object | null;
    cultivoId: number;
    creadoPorId: number;
    createdAt: Date;
  };

  constructor(data: any) {
    this.data = {
      id: data.id,
      tipo: data.tipo as TipoActividad,
      fecha: data.fecha,
      descripcion: data.descripcion,
      datos: data.datos,
      cultivoId: data.cultivo_id,
      creadoPorId: data.creado_por_id,
      createdAt: data.created_at,
    };
  }

  getId(): number { return this.data.id; }
  getTipo(): TipoActividad { return this.data.tipo; }
  getFecha(): Date { return this.data.fecha; }
  getDescripcion(): string { return this.data.descripcion; }
  getDatos(): object | null { return this.data.datos; }
  getCultivoId(): number { return this.data.cultivoId; }
  getCreadoPorId(): number { return this.data.creadoPorId; }

  toJson() {
    return {
      id: this.data.id,
      tipo: this.data.tipo,
      fecha: this.data.fecha.toISOString().split("T")[0],
      descripcion: this.data.descripcion,
      datos: this.data.datos,
      cultivoId: this.data.cultivoId,
      creadoPorId: this.data.creadoPorId,
    };
  }
}