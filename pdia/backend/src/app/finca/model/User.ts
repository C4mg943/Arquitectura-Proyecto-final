export const UserRoles = {
    PRODUCTOR: "PRODUCTOR",
    OPERARIO: "OPERARIO",
    TECNICO: "TECNICO",
    ADMINISTRADOR: "ADMINISTRADOR"
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

export interface UserPersistence {
    id: number;
    nombre: string;
    identificacion: string;
    email: string;
    passwordHash: string;
    rol: UserRole;
    productorId: number | null;
    failedAttempts: number;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export class User {
    private id: number;
    private nombre: string;
    private identificacion: string;
    private email: string;
    private passwordHash: string;
    private rol: UserRole;
    private productorId: number | null;
    private failedAttempts: number;
    private lockedUntil: Date | null;
    private createdAt: Date;
    private updatedAt: Date;

    constructor(data: UserPersistence) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.identificacion = data.identificacion;
        this.email = data.email;
        this.passwordHash = data.passwordHash;
        this.rol = data.rol;
        this.productorId = data.productorId;
        this.failedAttempts = data.failedAttempts;
        this.lockedUntil = data.lockedUntil;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    public getId(): number { return this.id; }
    public getNombre(): string { return this.nombre; }
    public getIdentificacion(): string { return this.identificacion; }
    public getEmail(): string { return this.email; }
    public getPasswordHash(): string { return this.passwordHash; }
    public getRol(): UserRole { return this.rol; }
    public getProductorId(): number | null { return this.productorId; }
    public getFailedAttempts(): number { return this.failedAttempts; }
    public getLockedUntil(): Date | null { return this.lockedUntil; }
    public getCreatedAt(): Date { return this.createdAt; }
    public getUpdatedAt(): Date { return this.updatedAt; }
}
