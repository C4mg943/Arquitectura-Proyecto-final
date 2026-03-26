export class Parcel {
  id: number;
  nombre: string;
  municipio: string;
  hectareas: number;
  latitud: number;
  longitud: number;

  constructor(id: number, nombre: string, municipio: string, hectareas: number, latitud: number, longitud: number) {
    this.id = id;
    this.nombre = nombre;
    this.municipio = municipio;
    this.hectareas = hectareas;
    this.latitud = latitud;
    this.longitud = longitud;
  }
}
