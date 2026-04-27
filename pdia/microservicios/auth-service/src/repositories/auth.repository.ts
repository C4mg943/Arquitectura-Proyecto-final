import pg from "pg";
import { User, UserRoles } from "../models/user.model.js";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "pdia_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  async create(data: {
    nombre: string;
    identificacion: string;
    email: string;
    passwordHash: string;
    rol: string;
    productorId?: number;
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (nombre, identificacion, email, password_hash, rol, productor_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.nombre,
        data.identificacion,
        data.email.toLowerCase(),
        data.passwordHash,
        data.rol,
        data.productorId || null,
      ]
    );
    return new User(result.rows[0]);
  }

  async updateLoginSecurity(
    userId: number,
    attempts: number,
    lockedUntil: Date | null
  ): Promise<void> {
    await pool.query(
      "UPDATE users SET failed_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3",
      [attempts, lockedUntil, userId]
    );
  }

  async saveResetToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, tokenHash, expiresAt]
    );
  }

  async findValidResetToken(tokenHash: string): Promise<{ id: number; userId: number } | null> {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [tokenHash]
    );
    return result.rows[0]
      ? { id: result.rows[0].id, userId: result.rows[0].user_id }
      : null;
  }

  async markResetTokenAsUsed(tokenId: number): Promise<void> {
    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
      [tokenId]
    );
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [passwordHash, userId]
    );
  }

  async isEmailTakenByAnotherUser(email: string, excludeUserId: number): Promise<boolean> {
    const result = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 AND id != $2",
      [email.toLowerCase(), excludeUserId]
    );
    return result.rows.length > 0;
  }

  async updateProfile(
    userId: number,
    data: { nombre?: string; identificacion?: string; email?: string }
  ): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.nombre) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(data.nombre);
    }
    if (data.identificacion) {
      updates.push(`identificacion = $${paramIndex++}`);
      values.push(data.identificacion);
    }
    if (data.email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email.toLowerCase());
    }

    if (updates.length === 0) return null;

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }
}