export type AlertaTipo = "LLUVIA" | "TEMPERATURA_ALTA" | "TEMPERATURA_BAJA" | "VIENTO";

export interface AlertaPersistence {
    id: number;
    tipo: AlertaTipo;
    valorDetectado: number;
    fecha: Date;
    cultivoId: number;
    leida: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class Alerta {
    private id: number;
    private tipo: AlertaTipo;
    private valorDetectado: number;
    private fecha: Date;
    private cultivoId: number;
    private leida: boolean;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(data: AlertaPersistence) {
        this.id = data.id;
        this.tipo = data.tipo;
        this.valorDetectado = data.valorDetectado;
        this.fecha = data.fecha;
        this.cultivoId = data.cultivoId;
        this.leida = data.leida;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    public getId(): number { return this.id; }
    public getTipo(): AlertaTipo { return this.tipo; }
    public getValorDetectado(): number { return this.valorDetectado; }
    public getFecha(): Date { return this.fecha; }
    public getCultivoId(): number { return this.cultivoId; }
    public getLeida(): boolean { return this.leida; }
    public getCreatedAt(): Date { return this.createdAt; }
    public getUpdatedAt(): Date { return this.updatedAt; }
}
