import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import { AuthRepository } from "../repository/AuthRepository";
import { AuthResponseDto, LoginDto, PublicUserDto, RegisterUserDto } from "../model/dto/AuthDto";
import { User, UserRole } from "../model/User";
import { AppError } from "../../../middleware/AppError";

export class AuthService {
    private repository: AuthRepository;
    private readonly maxAttempts: number;
    private readonly lockMinutes: number;

    constructor() {
        this.repository = new AuthRepository();
        this.maxAttempts = 5;
        this.lockMinutes = 15;
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
}
