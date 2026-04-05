import pool from "../../../config/connection/dbConnetions";
import { User } from "../model/User";
import type { UserPersistence, UserRole } from "../model/User";

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

interface ForgotTokenRow {
    id: number;
    userId: number;
    tokenHash: string;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
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

    public async updateProfile(
        userId: number,
        payload: { nombre?: string; identificacion?: string; email?: string }
    ): Promise<User | null> {
        const fields: string[] = [];
        const values: unknown[] = [userId];

        if (payload.nombre !== undefined) {
            fields.push(`nombre = $${values.length + 1}`);
            values.push(payload.nombre);
        }
        if (payload.identificacion !== undefined) {
            fields.push(`identificacion = $${values.length + 1}`);
            values.push(payload.identificacion);
        }
        if (payload.email !== undefined) {
            fields.push(`email = $${values.length + 1}`);
            values.push(payload.email);
        }

        if (fields.length === 0) {
            return this.findById(userId);
        }

        const query = `
            UPDATE users
            SET ${fields.join(", ")},
                updated_at = NOW()
            WHERE id = $1
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

        const row = await pool.oneOrNone<UserRow>(query, values);
        return row ? this.mapUser(row) : null;
    }

    public async updatePassword(userId: number, passwordHash: string): Promise<void> {
        const query = `
            UPDATE users
            SET password_hash = $2,
                failed_attempts = 0,
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = $1;
        `;
        await pool.none(query, [userId, passwordHash]);
    }

    public async isEmailTakenByAnotherUser(email: string, currentUserId: number): Promise<boolean> {
        const query = `
            SELECT id
            FROM users
            WHERE email = $1
              AND id <> $2
            LIMIT 1;
        `;
        const row = await pool.oneOrNone<{ id: number }>(query, [email, currentUserId]);
        return Boolean(row);
    }

    public async saveResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
        const query = `
            INSERT INTO password_reset_tokens (
                user_id,
                token_hash,
                expires_at,
                used_at
            ) VALUES ($1, $2, $3, NULL);
        `;
        await pool.none(query, [userId, tokenHash, expiresAt]);
    }

    public async findValidResetToken(tokenHash: string): Promise<ForgotTokenRow | null> {
        const query = `
            SELECT
                id,
                user_id AS "userId",
                token_hash AS "tokenHash",
                expires_at AS "expiresAt",
                used_at AS "usedAt",
                created_at AS "createdAt"
            FROM password_reset_tokens
            WHERE token_hash = $1
              AND used_at IS NULL
              AND expires_at > NOW()
            ORDER BY id DESC
            LIMIT 1;
        `;
        return pool.oneOrNone<ForgotTokenRow>(query, [tokenHash]);
    }

    public async markResetTokenAsUsed(tokenId: number): Promise<void> {
        const query = `
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE id = $1;
        `;
        await pool.none(query, [tokenId]);
    }

    public async invalidateUserResetTokens(userId: number): Promise<void> {
        const query = `
            UPDATE password_reset_tokens
            SET used_at = NOW()
            WHERE user_id = $1
              AND used_at IS NULL;
        `;
        await pool.none(query, [userId]);
    }
}
