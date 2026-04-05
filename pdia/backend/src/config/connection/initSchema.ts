import pool from "./dbConnetions";

export async function initSchema(): Promise<void> {
    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            identificacion VARCHAR(30) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            rol VARCHAR(20) NOT NULL,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    const parcelasTable = `
        CREATE TABLE IF NOT EXISTS parcelas (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            municipio VARCHAR(120) NOT NULL,
            hectareas NUMERIC(10,2) NOT NULL,
            latitud NUMERIC(10,6) NOT NULL,
            longitud NUMERIC(10,6) NOT NULL,
            productor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    const cultivosTable = `
        CREATE TABLE IF NOT EXISTS cultivos (
            id SERIAL PRIMARY KEY,
            tipo_cultivo VARCHAR(120) NOT NULL,
            fecha_siembra DATE NOT NULL,
            estado VARCHAR(30) NOT NULL,
            observaciones TEXT NULL,
            parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    const actividadesTable = `
        CREATE TABLE IF NOT EXISTS actividades (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(30) NOT NULL,
            fecha DATE NOT NULL,
            descripcion TEXT NOT NULL,
            datos JSONB NULL,
            cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
            creado_por_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    const alertasTable = `
        CREATE TABLE IF NOT EXISTS alertas (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(40) NOT NULL,
            valor_detectado NUMERIC(10,2) NOT NULL,
            fecha DATE NOT NULL,
            cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
            leida BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    const passwordResetTokensTable = `
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    await pool.none(usersTable);
    await pool.none(parcelasTable);
    await pool.none(cultivosTable);
    await pool.none(actividadesTable);
    await pool.none(alertasTable);
    await pool.none(passwordResetTokensTable);
}
