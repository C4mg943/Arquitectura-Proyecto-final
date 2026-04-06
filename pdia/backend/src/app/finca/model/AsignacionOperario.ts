export interface AsignacionOperarioPersistence {
    id: number;
    operarioId: number;
    parcelaId: number;
    asignadoPorId: number;
    fechaAsignacion: Date;
}

export class AsignacionOperario {
    private id: number;
    private operarioId: number;
    private parcelaId: number;
    private asignadoPorId: number;
    private fechaAsignacion: Date;

    constructor(data: AsignacionOperarioPersistence) {
        this.id = data.id;
        this.operarioId = data.operarioId;
        this.parcelaId = data.parcelaId;
        this.asignadoPorId = data.asignadoPorId;
        this.fechaAsignacion = data.fechaAsignacion;
    }

    public getId(): number { return this.id; }
    public getOperarioId(): number { return this.operarioId; }
    public getParcelaId(): number { return this.parcelaId; }
    public getAsignadoPorId(): number { return this.asignadoPorId; }
    public getFechaAsignacion(): Date { return this.fechaAsignacion; }
}
