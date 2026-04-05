export type ActividadTipo = "RIEGO" | "FERTILIZACION" | "PLAGA" | "OBSERVACION";

export interface ActividadPersistence {
    id: number;
    tipo: ActividadTipo;
    fecha: Date;
    descripcion: string;
    datos: Record<string, unknown> | null;
    cultivoId: number;
    creadoPorId: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Actividad {
    private id: number;
    private tipo: ActividadTipo;
    private fecha: Date;
    private descripcion: string;
    private datos: Record<string, unknown> | null;
    private cultivoId: number;
    private creadoPorId: number;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(data: ActividadPersistence) {
        this.id = data.id;
        this.tipo = data.tipo;
        this.fecha = data.fecha;
        this.descripcion = data.descripcion;
        this.datos = data.datos;
        this.cultivoId = data.cultivoId;
        this.creadoPorId = data.creadoPorId;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    public getId(): number { return this.id; }
    public getTipo(): ActividadTipo { return this.tipo; }
    public getFecha(): Date { return this.fecha; }
    public getDescripcion(): string { return this.descripcion; }
    public getDatos(): Record<string, unknown> | null { return this.datos; }
    public getCultivoId(): number { return this.cultivoId; }
    public getCreadoPorId(): number { return this.creadoPorId; }
    public getCreatedAt(): Date { return this.createdAt; }
    public getUpdatedAt(): Date { return this.updatedAt; }
}
