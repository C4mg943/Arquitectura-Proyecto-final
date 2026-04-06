class Finca {
    private _id: number;
    private _nombre: string;
    private _municipio: string;
    private _departamento: string;
    private _productorId: number;
    private _areaHectareas: number;
    private _codigoIca: string;
    private _createdAt: Date;

    constructor(
        id: number,
        nombre: string,
        municipio: string,
        departamento: string,
        productorId: number,
        areaHectareas: number,
        codigoIca: string,
        createdAt: Date
    ) {
        this._id = id;
        this._nombre = nombre;
        this._municipio = municipio;
        this._departamento = departamento;
        this._productorId = productorId;
        this._areaHectareas = areaHectareas;
        this._codigoIca = codigoIca;
        this._createdAt = createdAt;
    }

    // Getters
    public get id(): number {
        return this._id;
    }

    public get nombre(): string {
        return this._nombre;
    }

    public get municipio(): string {
        return this._municipio;
    }

    public get departamento(): string {
        return this._departamento;
    }

    public get productorId(): number {
        return this._productorId;
    }

    public get areaHectareas(): number {
        return this._areaHectareas;
    }

    public get codigoIca(): string {
        return this._codigoIca;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    // Setters
    public set id(value: number) {
        this._id = value;
    }

    public set nombre(value: string) {
        this._nombre = value;
    }

    public set municipio(value: string) {
        this._municipio = value;
    }

    public set departamento(value: string) {
        this._departamento = value;
    }

    public set productorId(value: number) {
        this._productorId = value;
    }

    public set areaHectareas(value: number) {
        this._areaHectareas = value;
    }

    public set codigoIca(value: string) {
        this._codigoIca = value;
    }

    public set createdAt(value: Date) {
        this._createdAt = value;
    }
}

export default Finca;