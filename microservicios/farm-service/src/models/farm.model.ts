export class Finca {
  private data: {
    id: number;
    nombre: string;
    ubicacion: string;
    descripcion: string | null;
    area: number;
    tipoFinca: string;
    propietarioId: number;
    codigoIcaInvima: string | null;
  };

  constructor(data: any) {
    this.data = {
      id: data.id,
      nombre: data.nombre,
      ubicacion: data.ubicacion,
      descripcion: data.descripcion,
      area: Number(data.area),
      tipoFinca: data.tipo_finca,
      propietarioId: data.propietario_id,
      codigoIcaInvima: data.codigo_ica_invima,
    };
  }

  getId(): number {
    return this.data.id;
  }
  getNombre(): string {
    return this.data.nombre;
  }
  getUbicacion(): string {
    return this.data.ubicacion;
  }
  getArea(): number {
    return this.data.area;
  }
  getPropietarioId(): number {
    return this.data.propietarioId;
  }
  getCodigoIcaInvima(): string | null {
    return this.data.codigoIcaInvima;
  }

  toJson() {
    return {
      id: this.data.id,
      nombre: this.data.nombre,
      ubicacion: this.data.ubicacion,
      descripcion: this.data.descripcion,
      area: this.data.area,
      tipoFinca: this.data.tipoFinca,
      propietarioId: this.data.propietarioId,
      codigoIcaInvima: this.data.codigoIcaInvima,
    };
  }
}

export class Parcela {
  private data: {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
    FincaId: number;
  };

  constructor(data: any) {
    this.data = {
      id: data.id,
      nombre: data.nombre,
      municipio: data.municipio,
      hectareas: Number(data.hectareas),
      latitud: Number(data.latitud),
      longitud: Number(data.longitud),
      FincaId: data.finca_id,
    };
  }

  getId(): number {
    return this.data.id;
  }
  getNombre(): string {
    return this.data.nombre;
  }
  getMunicipio(): string {
    return this.data.municipio;
  }
  getHectareas(): number {
    return this.data.hectareas;
  }
  getLatitud(): number {
    return this.data.latitud;
  }
  getLongitud(): number {
    return this.data.longitud;
  }
  getFincaId(): number {
    return this.data.FincaId;
  }

  toJson() {
    return {
      id: this.data.id,
      nombre: this.data.nombre,
      municipio: this.data.municipio,
      hectareas: this.data.hectareas,
      latitud: this.data.latitud,
      longitud: this.data.longitud,
      fincaId: this.data.FincaId,
    };
  }
}
