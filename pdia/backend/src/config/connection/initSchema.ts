import pool from "./dbConnetions";

export async function initSchema(): Promise<void> {
    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            identificacion VARCHAR(30) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            rol VARCHAR(20) NOT NULL CHECK (rol IN ('PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR')),
            productor_id INTEGER NULL REFERENCES users(id) ON DELETE CASCADE,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            CHECK (
                (rol = 'OPERARIO' AND productor_id IS NOT NULL)
                OR
                (rol <> 'OPERARIO' AND productor_id IS NULL)
            )
        );
    `;

    const fincasTable = `
        CREATE TABLE IF NOT EXISTS fincas (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(120) NOT NULL,
            ubicacion VARCHAR(200) NOT NULL,
            descripcion TEXT NULL,
            area NUMERIC(10,2) NOT NULL CHECK (area > 0),
            tipo_finca VARCHAR(30) NOT NULL CHECK (tipo_finca IN ('AGRICOLA', 'GANADERA', 'MIXTA', 'FORESTAL')),
            fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
            codigo_ica_invima VARCHAR(80) NULL,
            propietario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
            finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;

    const asignacionOperariosTable = `
        CREATE TABLE IF NOT EXISTS asignacion_operarios (
            id SERIAL PRIMARY KEY,
            operario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
            asignado_por_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE (operario_id, parcela_id)
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

    const legacyCompatibilityColumns = `
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'users'
            ) THEN
                ALTER TABLE users ADD COLUMN IF NOT EXISTS productor_id INTEGER NULL;
                BEGIN
                    ALTER TABLE users
                        ADD CONSTRAINT users_productor_id_fk
                        FOREIGN KEY (productor_id) REFERENCES users(id) ON DELETE CASCADE;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END;
            END IF;

            IF EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'parcelas'
            ) THEN
                ALTER TABLE parcelas ADD COLUMN IF NOT EXISTS finca_id INTEGER NULL;
                BEGIN
                    ALTER TABLE parcelas
                        ADD CONSTRAINT parcelas_finca_id_fk
                        FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END;
            END IF;
        END
        $$;
    `;

    const legacyBackfillParcelas = `
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'productor_id'
            )
            AND EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'finca_id'
            ) THEN
                INSERT INTO fincas (
                    nombre,
                    ubicacion,
                    descripcion,
                    area,
                    tipo_finca,
                    fecha_registro,
                    codigo_ica_invima,
                    propietario_id
                )
                SELECT
                    'Finca migrada',
                    'Ubicación pendiente',
                    'Registro generado automáticamente durante migración de esquema',
                    1,
                    'MIXTA',
                    CURRENT_DATE,
                    NULL,
                    legacy.productor_id
                FROM (
                    SELECT DISTINCT productor_id
                    FROM parcelas
                    WHERE productor_id IS NOT NULL
                ) AS legacy
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM fincas f
                    WHERE f.propietario_id = legacy.productor_id
                );

                UPDATE parcelas p
                SET finca_id = f.id
                FROM fincas f
                WHERE p.finca_id IS NULL
                  AND p.productor_id IS NOT NULL
                  AND f.propietario_id = p.productor_id;
            END IF;
        END
        $$;
    `;

    const enforceParcelaFincaNotNullWhenPossible = `
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'finca_id'
            )
            AND NOT EXISTS (
                SELECT 1
                FROM parcelas
                WHERE finca_id IS NULL
            ) THEN
                ALTER TABLE parcelas ALTER COLUMN finca_id SET NOT NULL;
            END IF;
        END
        $$;
    `;

    await pool.none(usersTable);
    await pool.none(fincasTable);
    await pool.none(parcelasTable);
    await pool.none(asignacionOperariosTable);
    await pool.none(cultivosTable);
    await pool.none(actividadesTable);
    await pool.none(alertasTable);
    await pool.none(passwordResetTokensTable);

    await pool.none(legacyCompatibilityColumns);
    await pool.none(legacyBackfillParcelas);
    await pool.none(enforceParcelaFincaNotNullWhenPossible);

    await pool.none("CREATE INDEX IF NOT EXISTS idx_users_productor_id ON users(productor_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_fincas_propietario_id ON fincas(propietario_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_parcelas_finca_id ON parcelas(finca_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_asignacion_operario_id ON asignacion_operarios(operario_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_asignacion_parcela_id ON asignacion_operarios(parcela_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_asignacion_asignado_por_id ON asignacion_operarios(asignado_por_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_cultivos_parcela_id ON cultivos(parcela_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_cultivos_tipo_lower ON cultivos(LOWER(tipo_cultivo))");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_actividades_cultivo_id ON actividades(cultivo_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_actividades_creado_por_id ON actividades(creado_por_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON actividades(fecha DESC)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_alertas_cultivo_id ON alertas(cultivo_id)");
    await pool.none("CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas(fecha DESC)");
}
