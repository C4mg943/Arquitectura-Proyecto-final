class Finca {
    private _id: number;
    private _nombre: string;
    private _municipio: string;
    private _departamento: string;
    private _productorId: number;
    private _createdAt: Date;
    private _updatedAt: Date;

    constructor(
        id: number,
        nombre: string,
        municipio: string,
        departamento: string,
        productorId: number,
        createdAt: Date,
        updatedAt: Date
    ) {
        this._id = id;
        this._nombre = nombre;
        this._municipio = municipio;
        this._departamento = departamento;
        this._productorId = productorId;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
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

    public get createdAt(): Date {
        return this._createdAt;
    }

    public get updatedAt(): Date {
        return this._updatedAt;
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

    public set createdAt(value: Date) {
        this._createdAt = value;
    }

    public set updatedAt(value: Date) {
        this._updatedAt = value;
    }
}

export default Finca;