export type TipoFinca = "AGRICOLA" | "GANADERA" | "MIXTA" | "FORESTAL";

export interface FincaPersistence {
    id: number;
    nombre: string;
    ubicacion: string;
    descripcion: string | null;
    area: number;
    tipoFinca: TipoFinca;
    fechaRegistro: Date;
    codigoIcaInvima: string | null;
    propietarioId: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Finca {
    private id: number;
    private nombre: string;
    private ubicacion: string;
    private descripcion: string | null;
    private area: number;
    private tipoFinca: TipoFinca;
    private fechaRegistro: Date;
    private codigoIcaInvima: string | null;
    private propietarioId: number;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(data: FincaPersistence) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.ubicacion = data.ubicacion;
        this.descripcion = data.descripcion;
        this.area = data.area;
        this.tipoFinca = data.tipoFinca;
        this.fechaRegistro = data.fechaRegistro;
        this.codigoIcaInvima = data.codigoIcaInvima;
        this.propietarioId = data.propietarioId;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    public getId(): number { return this.id; }
    public getNombre(): string { return this.nombre; }
    public getUbicacion(): string { return this.ubicacion; }
    public getDescripcion(): string | null { return this.descripcion; }
    public getArea(): number { return this.area; }
    public getTipoFinca(): TipoFinca { return this.tipoFinca; }
    public getFechaRegistro(): Date { return this.fechaRegistro; }
    public getCodigoIcaInvima(): string | null { return this.codigoIcaInvima; }
    public getPropietarioId(): number { return this.propietarioId; }
    public getCreatedAt(): Date { return this.createdAt; }
    public getUpdatedAt(): Date { return this.updatedAt; }
}
