BEGIN;

DROP TABLE IF EXISTS alertas CASCADE;
DROP TABLE IF EXISTS actividades CASCADE;
DROP TABLE IF EXISTS cultivos CASCADE;
DROP TABLE IF EXISTS asignacion_operarios CASCADE;
DROP TABLE IF EXISTS parcelas CASCADE;
DROP TABLE IF EXISTS fincas CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    identificacion VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR')),
    productor_id INTEGER NULL REFERENCES users(id) ON DELETE CASCADE,
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (
        (rol = 'OPERARIO' AND productor_id IS NOT NULL)
        OR
        (rol <> 'OPERARIO' AND productor_id IS NULL)
    )
);

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE fincas (
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

CREATE TABLE parcelas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    municipio VARCHAR(120) NOT NULL,
    hectareas NUMERIC(10,2) NOT NULL CHECK (hectareas > 0),
    latitud NUMERIC(10,6) NOT NULL CHECK (latitud BETWEEN -90 AND 90),
    longitud NUMERIC(10,6) NOT NULL CHECK (longitud BETWEEN -180 AND 180),
    finca_id INTEGER NOT NULL REFERENCES fincas(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE asignacion_operarios (
    id SERIAL PRIMARY KEY,
    operario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    asignado_por_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (operario_id, parcela_id)
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

CREATE INDEX idx_users_productor_id ON users(productor_id);
CREATE INDEX idx_fincas_propietario_id ON fincas(propietario_id);
CREATE INDEX idx_parcelas_finca_id ON parcelas(finca_id);
CREATE INDEX idx_asignacion_operario_id ON asignacion_operarios(operario_id);
CREATE INDEX idx_asignacion_parcela_id ON asignacion_operarios(parcela_id);
CREATE INDEX idx_asignacion_asignado_por_id ON asignacion_operarios(asignado_por_id);
CREATE INDEX idx_cultivos_parcela_id ON cultivos(parcela_id);
CREATE INDEX idx_cultivos_tipo_lower ON cultivos (LOWER(tipo_cultivo));
CREATE INDEX idx_actividades_cultivo_id ON actividades(cultivo_id);
CREATE INDEX idx_actividades_creado_por_id ON actividades(creado_por_id);
CREATE INDEX idx_actividades_fecha ON actividades(fecha DESC);
CREATE INDEX idx_alertas_cultivo_id ON alertas(cultivo_id);
CREATE INDEX idx_alertas_fecha ON alertas(fecha DESC);

COMMIT;
