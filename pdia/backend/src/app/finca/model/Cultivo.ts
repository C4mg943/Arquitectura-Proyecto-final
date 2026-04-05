export type CultivoEstado = "EN_CRECIMIENTO" | "COSECHADO" | "AFECTADO";

export interface CultivoPersistence {
    id: number;
    tipoCultivo: string;
    fechaSiembra: Date;
    estado: CultivoEstado;
    observaciones: string | null;
    parcelaId: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Cultivo {
    private id: number;
    private tipoCultivo: string;
    private fechaSiembra: Date;
    private estado: CultivoEstado;
    private observaciones: string | null;
    private parcelaId: number;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(data: CultivoPersistence) {
        this.id = data.id;
        this.tipoCultivo = data.tipoCultivo;
        this.fechaSiembra = data.fechaSiembra;
        this.estado = data.estado;
        this.observaciones = data.observaciones;
        this.parcelaId = data.parcelaId;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    public getId(): number { return this.id; }
    public getTipoCultivo(): string { return this.tipoCultivo; }
    public getFechaSiembra(): Date { return this.fechaSiembra; }
    public getEstado(): CultivoEstado { return this.estado; }
    public getObservaciones(): string | null { return this.observaciones; }
    public getParcelaId(): number { return this.parcelaId; }
    public getCreatedAt(): Date { return this.createdAt; }
    public getUpdatedAt(): Date { return this.updatedAt; }
}
