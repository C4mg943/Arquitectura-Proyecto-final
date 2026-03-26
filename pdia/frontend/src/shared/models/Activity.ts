export class Activity {
  id: number;
  tipo: 'RIEGO' | 'FERTILIZACION' | 'PLAGA' | 'OBSERVACION';
  fecha: string;
  descripcion: string;

  constructor(id: number, tipo: 'RIEGO' | 'FERTILIZACION' | 'PLAGA' | 'OBSERVACION', fecha: string, descripcion: string) {
    this.id = id;
    this.tipo = tipo;
    this.fecha = fecha;
    this.descripcion = descripcion;
  }
}
