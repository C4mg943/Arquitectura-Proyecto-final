import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { AuthRepository } from "../repositories/auth.repository.js";
import { User, UserRoles } from "../models/user.model.js";
import { publishEvent } from "../config/rabbitmq.js";

export interface RegisterDto {
  nombre: string;
  identificacion: string;
  email: string;
  password: string;
  rol?: string;
  productorId?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface UpdateProfileDto {
  nombre?: string;
  email?: string;
  identificacion?: string;
}

export class AuthService {
  private repository: AuthRepository;
  private readonly maxAttempts = 5;
  private readonly lockMinutes = 15;
  private readonly resetTokenMinutes = 30;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new Error("El correo ya está registrado");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const rol = data.rol || UserRoles.PRODUCTOR;

const user = await this.repository.create({
      nombre: data.nombre,
      identificacion: data.identificacion,
      email: data.email,
      passwordHash,
      rol,
      productorId: data.productorId,
    });

    await publishEvent("user.registered", {
      userId: user.getId(),
      email: user.getEmail(),
      rol: user.getRol(),
    });

    return {
      token: this.generateToken(user),
      user: user.toPublicJson(),
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const user = await this.repository.findByEmail(data.email);
    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    const lockTime = user.getLockedUntil();
    if (lockTime && lockTime > new Date()) {
      throw new Error("Cuenta temporalmente bloqueada");
    }

    const isValid = await bcrypt.compare(data.password, user.getPasswordHash());
    if (!isValid) {
      const attempts = user.getFailedAttempts() + 1;
      if (attempts >= this.maxAttempts) {
        const lockedUntil = new Date(Date.now() + this.lockMinutes * 60 * 1000);
        await this.repository.updateLoginSecurity(user.getId(), 0, lockedUntil);
        throw new Error("Cuenta bloqueada por 15 minutos");
      }
      await this.repository.updateLoginSecurity(user.getId(), attempts, null);
      throw new Error("Credenciales inválidas");
    }

    await this.repository.updateLoginSecurity(user.getId(), 0, null);

    return {
      token: this.generateToken(user),
      user: user.toPublicJson(),
    };
  }

  async getProfile(userId: number): Promise<any> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user.toPublicJson();
  }

  async forgotPassword(data: ForgotPasswordDto): Promise<{ requestAccepted: boolean }> {
    const user = await this.repository.findByEmail(data.email);
    if (!user) {
      return { requestAccepted: true };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + this.resetTokenMinutes * 60 * 1000);

    await this.repository.saveResetToken(user.getId(), tokenHash, expiresAt);

    return { requestAccepted: true };
  }

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const token = await this.repository.findValidResetToken(tokenHash);

    if (!token) {
      throw new Error("Token de recuperación inválido o expirado");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    await this.repository.updatePassword(token.userId, passwordHash);
    await this.repository.markResetTokenAsUsed(token.id);
  }

  async updateProfile(
    userId: number,
    data: UpdateProfileDto
  ): Promise<{ id: number; nombre: string; email: string; rol: string }> {
    if (data.email) {
      const taken = await this.repository.isEmailTakenByAnotherUser(data.email, userId);
      if (taken) {
        throw new Error("El correo ya está registrado");
      }
    }

    const user = await this.repository.updateProfile(userId, data);
    if (!user) {
      throw new Error("No fue posible actualizar el perfil");
    }

    return user.toPublicJson();
  }

  async validateOwner(userId: number): Promise<boolean> {
    const user = await this.repository.findById(userId);
    return user?.getRol() === UserRoles.PRODUCTOR;
  }

private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET || "pdia-secret-key-change-in-production";

    return jwt.sign(
      {
        userId: user.getId(),
        email: user.getEmail(),
        rol: user.getRol(),
      },
      secret,
      { expiresIn: "7d" as jwt.SignOptions["expiresIn"] }
    );
  }
}