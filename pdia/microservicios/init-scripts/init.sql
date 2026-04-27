-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA MICROSERVICIOS PDIA
-- ============================================

-- Tabla de Usuarios (Auth Service)
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
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de Token de Recuperación de Contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de Fincas (Farm Service)
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

-- Tabla de Parcelas (Farm Service)
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

-- Tabla de Asignación de Operarios (Farm Service)
CREATE TABLE IF NOT EXISTS asignacion_operarios (
    id SERIAL PRIMARY KEY,
    operario_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    asignado_por_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (operario_id, parcela_id)
);

-- Tabla de Cultivos (Crop Service)
CREATE TABLE IF NOT EXISTS cultivos (
    id SERIAL PRIMARY KEY,
    tipo_cultivo VARCHAR(120) NOT NULL,
    fecha_siembra DATE NOT NULL,
    estado VARCHAR(30) NOT NULL CHECK (estado IN ('EN_CRECIMIENTO', 'COSECHADO', 'AFECTADO')),
    observaciones TEXT NULL,
    parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de Actividades (Activity Service)
CREATE TABLE IF NOT EXISTS actividades (
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

-- Tabla de Alertas (Alert Service)
CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(40) NOT NULL CHECK (tipo IN ('LLUVIA', 'TEMPERATURA_ALTA', 'TEMPERATURA_BAJA', 'VIENTO')),
    valor_detectado NUMERIC(10,2) NOT NULL,
    fecha DATE NOT NULL,
    cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de Recomendaciones (Recommendation Service)
CREATE TABLE IF NOT EXISTS recomendaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(40) NOT NULL CHECK (tipo IN ('RIEGO', 'FERTILIZACION', 'FITORECOMENDACION')),
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    cultivo_id INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de Notificaciones (Notification Service)
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(40) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de Configuración de Umbrales (Alert Service)
CREATE TABLE IF NOT EXISTS umbrales (
    id SERIAL PRIMARY KEY,
    tipo_cultivo VARCHAR(120) NOT NULL,
    temperatura_min NUMERIC(5,2),
    temperatura_max NUMERIC(5,2),
    lluvia_max NUMERIC(5,2),
    viento_max NUMERIC(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (tipo_cultivo)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_productor_id ON users(productor_id);
CREATE INDEX IF NOT EXISTS idx_fincas_propietario_id ON fincas(propietario_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_finca_id ON parcelas(finca_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_operario_id ON asignacion_operarios(operario_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_parcela_id ON asignacion_operarios(parcela_id);
CREATE INDEX IF NOT EXISTS idx_cultivos_parcela_id ON cultivos(parcela_id);
CREATE INDEX IF NOT EXISTS idx_cultivos_tipo ON LOWER(cultivos.tipo_cultivo);
CREATE INDEX IF NOT EXISTS idx_actividades_cultivo_id ON actividades(cultivo_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON actividades(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_actividades_creado_por_id ON actividades(creado_por_id);
CREATE INDEX IF NOT EXISTS idx_alertas_cultivo_id ON alertas(cultivo_id);
CREATE INDEX IF NOT EXISTS idx_alertas_fecha ON alertas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_cultivo_id ON recomendaciones(cultivo_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- ============================================
-- DATOS INICIALES DE UMbrales
-- ============================================
INSERT INTO umbrales (tipo_cultivo, temperatura_min, temperatura_max, lluvia_max, viento_max) VALUES
    ('Maíz', 18, 30, 70, 50),
    ('Arroz', 20, 35, 70, 50),
    ('Frijol', 15, 28, 70, 50),
    ('Tomate', 18, 30, 70, 50),
    ('Papaya', 20, 32, 70, 50),
    ('Banano', 20, 30, 70, 50),
    ('Café', 18, 28, 70, 50),
    ('默认值', 15, 35, 70, 50)
ON CONFLICT (tipo_cultivo) DO NOTHING;