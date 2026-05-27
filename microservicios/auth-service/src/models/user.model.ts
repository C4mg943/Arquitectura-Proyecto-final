export enum UserRoles {
  PRODUCTOR = "PRODUCTOR",
  OPERARIO = "OPERARIO",
  TECNICO = "TECNICO",
  ADMINISTRADOR = "ADMINISTRADOR",
}

export class User {
  private data: {
    id: number;
    nombre: string;
    identificacion: string;
    email: string;
    password_hash: string;
    rol: string;
    productor_id: number | null;
    failed_attempts: number;
    locked_until: Date | null;
    created_at: Date;
  };

  constructor(data: any) {
    this.data = {
      id: data.id,
      nombre: data.nombre,
      identificacion: data.identificacion,
      email: data.email,
      password_hash: data.password_hash,
      rol: data.rol,
      productor_id: data.productor_id,
      failed_attempts: data.failed_attempts || 0,
      locked_until: data.locked_until,
      created_at: data.created_at,
    };
  }

  getId(): number {
    return this.data.id;
  }

  getNombre(): string {
    return this.data.nombre;
  }

  getIdentificacion(): string {
    return this.data.identificacion;
  }

  getEmail(): string {
    return this.data.email;
  }

  getPasswordHash(): string {
    return this.data.password_hash;
  }

  getRol(): string {
    return this.data.rol;
  }

  getProductorId(): number | null {
    return this.data.productor_id;
  }

  getFailedAttempts(): number {
    return this.data.failed_attempts;
  }

  getLockedUntil(): Date | null {
    return this.data.locked_until;
  }

  toPublicJson() {
    return {
      id: this.data.id,
      nombre: this.data.nombre,
      identificacion: this.data.identificacion,
      email: this.data.email,
      rol: this.data.rol,
      productorId: this.data.productor_id,
    };
  }
}