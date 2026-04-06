BEGIN;

-- 1. Limpieza de tablas existentes (en orden inverso de jerarquía)
DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS actividades CASCADE;
DROP TABLE IF EXISTS cultivos CASCADE;
DROP TABLE IF EXISTS parcelas CASCADE;
DROP TABLE IF EXISTS fincas CASCADE; -- Nueva tabla agregada
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Tabla de Usuarios
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       nombre VARCHAR(120) NOT NULL,
                       identificacion VARCHAR(30) NOT NULL,
                       email VARCHAR(150) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       rol VARCHAR(20) NOT NULL CHECK (rol IN ('PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR')),
                       failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
                       locked_until TIMESTAMP NULL,
                       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Fincas (Contenedor de parcelas)
CREATE TABLE fincas (
                        id SERIAL PRIMARY KEY,
                        nombre VARCHAR(120) NOT NULL,
                        municipio VARCHAR(120) NOT NULL,
                        departamento VARCHAR(120) DEFAULT 'Magdalena',
                        area_hectareas NUMERIC(10,2) DEFAULT 0 CHECK (area_hectareas >= 0),
                        codigo_ica VARCHAR(50),
                        productor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Parcelas (Ahora referenciada a FINCAS)
CREATE TABLE parcelas (
                          id SERIAL PRIMARY KEY,
                          nombre VARCHAR(120) NOT NULL,
                          hectareas NUMERIC(10,2) NOT NULL CHECK (hectareas > 0),
                          latitud NUMERIC(10,6) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
                          longitud NUMERIC(10,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
                          finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
                          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Tabla de Cultivos
CREATE TABLE cultivos (
                          id SERIAL PRIMARY KEY,
                          tipo_cultivo VARCHAR(120) NOT NULL,
                          fecha_siembra DATE NOT NULL,
                          estado VARCHAR(30) NOT NULL CHECK (estado IN ('EN_CRECIMIENTO', 'COSECHADO', 'AFECTADO')),
                          observaciones TEXT NULL,
                          parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
                          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Tabla de Actividades
CREATE TABLE actividades (
                             id SERIAL PRIMARY KEY,
                             tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('RIEGO', 'FERTILIZACION', 'PLAGA', 'OBSERVACION')),
                             fecha DATE NOT NULL,
                             descripcion TEXT NOT NULL,
                             datos JSONB NULL,
                             cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
                             creado_por_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                             updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. Tabla de Alertas
CREATE TABLE alertas (
                         id SERIAL PRIMARY KEY,
                         tipo VARCHAR(40) NOT NULL CHECK (tipo IN ('LLUVIA', 'TEMPERATURA_ALTA', 'TEMPERATURA_BAJA', 'VIENTO')),
                         valor_detectado NUMERIC(10,2) NOT NULL,
                         fecha DATE NOT NULL,
                         cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
                         leida BOOLEAN NOT NULL DEFAULT FALSE,
                         created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                         updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Índices
CREATE INDEX idx_fincas_productor_id ON fincas(productor_id);
CREATE INDEX idx_parcelas_finca_id ON parcelas(finca_id);
CREATE INDEX idx_cultivos_parcela_id ON cultivos(parcela_id);
CREATE INDEX idx_actividades_cultivo_id ON actividades(cultivo_id);
CREATE INDEX idx_alertas_cultivo_id ON alertas(cultivo_id);

COMMIT;

-- ==========================================
-- DATOS DE PRUEBA (SEEDERS)
-- ==========================================

-- 1. Insertar Usuario
INSERT INTO users (nombre, identificacion, email, password_hash, rol)
VALUES ('Productor Demo', '123456789', 'test@test.com', '$2b$10$lAMK7SAjZ0ClmhvgA4LKlO.h7UZLGRmsp5AwduvXhy7XkLr2ufz1O', 'PRODUCTOR');

-- 2. Insertar Finca vinculada al usuario
INSERT INTO fincas (nombre, municipio, departamento, area_hectareas, codigo_ica, productor_id)
SELECT 'Finca La Bendición', 'Santa Marta', 'Magdalena', 25.50, 'ICA-12345', id
FROM users WHERE email = 'test@test.com' LIMIT 1;

-- 3. Insertar Parcela vinculada a la Finca
INSERT INTO parcelas (nombre, hectareas, latitud, longitud, finca_id)
SELECT 'Lote Norte - Maíz', 5.00, 11.2408, -74.1990, id
FROM fincas WHERE nombre = 'Finca La Bendición' LIMIT 1;

-- 4. Insertar Cultivo en la Parcela
INSERT INTO cultivos (tipo_cultivo, fecha_siembra, estado, observaciones, parcela_id)
SELECT 'Maíz Amarillo', CURRENT_DATE - 30, 'EN_CRECIMIENTO', 'Fase vegetativa inicial', id
FROM parcelas WHERE nombre = 'Lote Norte - Maíz' LIMIT 1;