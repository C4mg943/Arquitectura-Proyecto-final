import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { AuthRepository } from "../repository/AuthRepository";
import {
    type AuthResponseDto,
    type ForgotPasswordDto,
    type ForgotPasswordResponseDto,
    type LoginDto,
    type PublicUserDto,
    type RegisterUserDto,
    type ResetPasswordDto,
    type UpdatePasswordDto,
    type UpdateProfileDto
} from "../model/dto/AuthDto";
import { User, UserRole } from "../model/User";
import { AppError } from "../../../middleware/AppError";

export class AuthService {
    private repository: AuthRepository;
    private readonly maxAttempts: number;
    private readonly lockMinutes: number;
    private readonly resetTokenMinutes: number;

    constructor() {
        this.repository = new AuthRepository();
        this.maxAttempts = 5;
        this.lockMinutes = 15;
        this.resetTokenMinutes = 30;
    }

    public async register(payload: RegisterUserDto): Promise<AuthResponseDto> {
        const found = await this.repository.findByEmail(payload.email);
        if (found) {
            throw new AppError("El correo ya está registrado", 409);
        }

        const passwordHash = await bcrypt.hash(payload.password, 10);
        const role: UserRole = payload.rol ?? "PRODUCTOR";

        const createdUser = await this.repository.create({
            nombre: payload.nombre,
            identificacion: payload.identificacion,
            email: payload.email,
            passwordHash,
            rol: role
        });

        const token = this.buildToken(createdUser);

        return {
            token,
            user: this.toPublicUser(createdUser)
        };
    }

    public async login(payload: LoginDto): Promise<AuthResponseDto> {
        const user = await this.repository.findByEmail(payload.email);
        if (!user) {
            throw new AppError("Credenciales inválidas", 401);
        }

        const lockTime = user.getLockedUntil();
        if (lockTime && lockTime > new Date()) {
            throw new AppError("Cuenta temporalmente bloqueada por intentos fallidos", 423);
        }

        const isValid = await bcrypt.compare(payload.password, user.getPasswordHash());
        if (!isValid) {
            const updatedAttempts = user.getFailedAttempts() + 1;
            if (updatedAttempts >= this.maxAttempts) {
                const lockedUntil = new Date(Date.now() + this.lockMinutes * 60 * 1000);
                await this.repository.updateLoginSecurity(user.getId(), 0, lockedUntil);
                throw new AppError("Cuenta bloqueada por 15 minutos", 423);
            }
            await this.repository.updateLoginSecurity(user.getId(), updatedAttempts, null);
            throw new AppError("Credenciales inválidas", 401);
        }

        await this.repository.updateLoginSecurity(user.getId(), 0, null);

        return {
            token: this.buildToken(user),
            user: this.toPublicUser(user)
        };
    }

    public async getProfile(userId: number): Promise<PublicUserDto> {
        const user = await this.repository.findById(userId);
        if (!user) {
            throw new AppError("Usuario no encontrado", 404);
        }
        return this.toPublicUser(user);
    }

    public async forgotPassword(payload: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
        const user = await this.repository.findByEmail(payload.email);
        if (!user) {
            return { requestAccepted: true };
        }

        const token = randomBytes(32).toString("hex");
        const tokenHash = this.hashResetToken(token);
        const expiresAt = new Date(Date.now() + this.resetTokenMinutes * 60 * 1000);

        await this.repository.invalidateUserResetTokens(user.getId());
        await this.repository.saveResetToken(user.getId(), tokenHash, expiresAt);

        const frontendBaseUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? "http://localhost:5173").replace(/\/$/, "");
        const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;

        if (process.env.NODE_ENV === "production") {
            return { requestAccepted: true };
        }

        return {
            requestAccepted: true,
            resetUrl
        };
    }

    public async resetPassword(payload: ResetPasswordDto): Promise<void> {
        const tokenHash = this.hashResetToken(payload.token);
        const resetToken = await this.repository.findValidResetToken(tokenHash);

        if (!resetToken) {
            throw new AppError("El token de recuperación es inválido o expiró", 400);
        }

        const passwordHash = await bcrypt.hash(payload.password, 10);
        await this.repository.updatePassword(resetToken.userId, passwordHash);
        await this.repository.markResetTokenAsUsed(resetToken.id);
        await this.repository.invalidateUserResetTokens(resetToken.userId);
    }

    public async updateProfile(userId: number, payload: UpdateProfileDto): Promise<PublicUserDto> {
        const currentUser = await this.repository.findById(userId);
        if (!currentUser) {
            throw new AppError("Usuario no encontrado", 404);
        }

        const trimmedPayload: UpdateProfileDto = {
            nombre: payload.nombre?.trim(),
            identificacion: payload.identificacion?.trim(),
            email: payload.email?.trim().toLowerCase()
        };

        if (trimmedPayload.email && trimmedPayload.email !== currentUser.getEmail().toLowerCase()) {
            const alreadyTaken = await this.repository.isEmailTakenByAnotherUser(trimmedPayload.email, userId);
            if (alreadyTaken) {
                throw new AppError("El correo ya está registrado", 409);
            }
        }

        const updatedUser = await this.repository.updateProfile(userId, trimmedPayload);
        if (!updatedUser) {
            throw new AppError("No fue posible actualizar el perfil", 400);
        }

        return this.toPublicUser(updatedUser);
    }

    public async updatePassword(userId: number, payload: UpdatePasswordDto): Promise<void> {
        const user = await this.repository.findById(userId);
        if (!user) {
            throw new AppError("Usuario no encontrado", 404);
        }

        if (payload.currentPassword === payload.newPassword) {
            throw new AppError("La nueva contraseña debe ser diferente a la actual", 400);
        }

        const validCurrentPassword = await bcrypt.compare(payload.currentPassword, user.getPasswordHash());
        if (!validCurrentPassword) {
            throw new AppError("La contraseña actual no es correcta", 401);
        }

        const passwordHash = await bcrypt.hash(payload.newPassword, 10);
        await this.repository.updatePassword(userId, passwordHash);
    }

    private toPublicUser(user: User): PublicUserDto {
        return {
            id: user.getId(),
            nombre: user.getNombre(),
            identificacion: user.getIdentificacion(),
            email: user.getEmail(),
            rol: user.getRol()
        };
    }

    private buildToken(user: User): string {
        const secret = process.env.JWT_SECRET ?? "dev-secret-change";
        const expiration = process.env.JWT_EXPIRATION ?? "7d";
        const options: SignOptions = {
            expiresIn: expiration as SignOptions["expiresIn"]
        };
        return jwt.sign(
            {
                userId: user.getId(),
                email: user.getEmail(),
                rol: user.getRol()
            },
            secret,
            options
        );
    }

    private hashResetToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }
}
