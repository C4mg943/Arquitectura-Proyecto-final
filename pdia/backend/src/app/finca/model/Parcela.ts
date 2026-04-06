export interface ParcelaPersistence {
    id: number;
    nombre: string;
    municipio: string;
    hectareas: number;
    latitud: number;
    longitud: number;
    fincaId: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Parcela {
    private id: number;
    private nombre: string;
    private municipio: string;
    private hectareas: number;
    private latitud: number;
    private longitud: number;
    private fincaId: number;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(data: ParcelaPersistence) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.municipio = data.municipio;
        this.hectareas = data.hectareas;
        this.latitud = data.latitud;
        this.longitud = data.longitud;
        this.fincaId = data.fincaId;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    public getId(): number { return this.id; }
    public getNombre(): string { return this.nombre; }
    public getMunicipio(): string { return this.municipio; }
    public getHectareas(): number { return this.hectareas; }
    public getLatitud(): number { return this.latitud; }
    public getLongitud(): number { return this.longitud; }
    public getFincaId(): number { return this.fincaId; }
    public getCreatedAt(): Date { return this.createdAt; }
    public getUpdatedAt(): Date { return this.updatedAt; }
}
