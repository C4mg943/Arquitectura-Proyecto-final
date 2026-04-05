import pool from "../../../config/connection/dbConnetions";
import { User, UserPersistence, UserRole } from "../model/User";

interface RegisterUserPersistence {
    nombre: string;
    identificacion: string;
    email: string;
    passwordHash: string;
    rol: UserRole;
}

interface UserRow {
    id: number;
    nombre: string;
    identificacion: string;
    email: string;
    passwordHash: string;
    rol: UserRole;
    failedAttempts: number;
    lockedUntil: string | null;
    createdAt: string;
    updatedAt: string;
}

export class AuthRepository {
    private mapUser(row: UserRow): User {
        const userData: UserPersistence = {
            id: row.id,
            nombre: row.nombre,
            identificacion: row.identificacion,
            email: row.email,
            passwordHash: row.passwordHash,
            rol: row.rol,
            failedAttempts: row.failedAttempts ?? 0,
            lockedUntil: row.lockedUntil ? new Date(row.lockedUntil) : null,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
        return new User(userData);
    }

    public async findByEmail(email: string): Promise<User | null> {
        const query = `
            SELECT
                id,
                nombre,
                identificacion,
                email,
                password_hash AS "passwordHash",
                rol,
                failed_attempts AS "failedAttempts",
                locked_until AS "lockedUntil",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM users
            WHERE email = $1
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<UserRow>(query, [email]);
        return row ? this.mapUser(row) : null;
    }

    public async findById(id: number): Promise<User | null> {
        const query = `
            SELECT
                id,
                nombre,
                identificacion,
                email,
                password_hash AS "passwordHash",
                rol,
                failed_attempts AS "failedAttempts",
                locked_until AS "lockedUntil",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
            FROM users
            WHERE id = $1
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<UserRow>(query, [id]);
        return row ? this.mapUser(row) : null;
    }

    public async create(payload: RegisterUserPersistence): Promise<User> {
        const query = `
            INSERT INTO users (
                nombre,
                identificacion,
                email,
                password_hash,
                rol,
                failed_attempts,
                locked_until
            ) VALUES ($1, $2, $3, $4, $5, 0, NULL)
            RETURNING
                id,
                nombre,
                identificacion,
                email,
                password_hash AS "passwordHash",
                rol,
                failed_attempts AS "failedAttempts",
                locked_until AS "lockedUntil",
                created_at AS "createdAt",
                updated_at AS "updatedAt";
        `;

        const row = await pool.one<UserRow>(query, [
            payload.nombre,
            payload.identificacion,
            payload.email,
            payload.passwordHash,
            payload.rol
        ]);
        return this.mapUser(row);
    }

    public async updateLoginSecurity(userId: number, failedAttempts: number, lockedUntil: Date | null): Promise<void> {
        const query = `
            UPDATE users
            SET failed_attempts = $2,
                locked_until = $3,
                updated_at = NOW()
            WHERE id = $1;
        `;
        await pool.none(query, [userId, failedAttempts, lockedUntil]);
    }
}
