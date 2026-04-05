BEGIN;

DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS actividades CASCADE;
DROP TABLE IF EXISTS cultivos CASCADE;
DROP TABLE IF EXISTS parcelas CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;

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

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE parcelas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    municipio VARCHAR(120) NOT NULL,
    hectareas NUMERIC(10,2) NOT NULL CHECK (hectareas > 0),
    latitud NUMERIC(10,6) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
    longitud NUMERIC(10,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    productor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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

CREATE INDEX idx_parcelas_productor_id ON parcelas(productor_id);
CREATE INDEX idx_cultivos_parcela_id ON cultivos(parcela_id);
CREATE INDEX idx_cultivos_tipo_lower ON cultivos (LOWER(tipo_cultivo));
CREATE INDEX idx_actividades_cultivo_id ON actividades(cultivo_id);
CREATE INDEX idx_actividades_fecha ON actividades(fecha DESC);
CREATE INDEX idx_alertas_cultivo_id ON alertas(cultivo_id);
CREATE INDEX idx_alertas_fecha ON alertas(fecha DESC);

COMMIT;

INSERT INTO users (nombre, identificacion, email, password_hash, rol)
VALUES (
  'Productor Demo',
  '123456789',
  'test@test.com',
  '$2b$10$lAMK7SAjZ0ClmhvgA4LKlO.h7UZLGRmsp5AwduvXhy7XkLr2ufz1O',
  'PRODUCTOR'
);

INSERT INTO parcelas (nombre, municipio, hectareas, latitud, longitud, productor_id)
SELECT
  'Finca El Roble',
  'Santa Marta',
  15.00,
  11.240800,
  -74.199000,
  u.id
FROM users u
WHERE u.email = 'test@test.com'
LIMIT 1;

INSERT INTO cultivos (tipo_cultivo, fecha_siembra, estado, observaciones, parcela_id)
SELECT
  'Tomate',
  CURRENT_DATE - 20,
  'EN_CRECIMIENTO',
  'Siembra inicial',
  p.id
FROM parcelas p
ORDER BY p.id DESC
LIMIT 1;

INSERT INTO actividades (tipo, fecha, descripcion, datos, cultivo_id, creado_por_id)
SELECT
  'RIEGO',
  CURRENT_DATE - 1,
  'Riego de mantenimiento',
  '{"cantidadAgua":"50L"}'::jsonb,
  c.id,
  u.id
FROM cultivos c
JOIN parcelas p ON p.id = c.parcela_id
JOIN users u ON u.id = p.productor_id
WHERE u.email = 'test@test.com'
LIMIT 1;

INSERT INTO alertas (tipo, valor_detectado, fecha, cultivo_id, leida)
SELECT
  'LLUVIA',
  82.50,
  CURRENT_DATE,
  c.id,
  FALSE
FROM cultivos c
JOIN parcelas p ON p.id = c.parcela_id
JOIN users u ON u.id = p.productor_id
WHERE u.email = 'test@test.com'
LIMIT 1;
