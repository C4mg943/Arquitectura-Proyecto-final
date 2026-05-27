-- ============================================
-- USUARIOS DE PRUEBA
-- ============================================
-- Password para todos los usuarios semilla: admin123
-- Los hashes bcrypt son válidos y se generaron con bcryptjs (cost factor 10).

-- Usuario Administrador
INSERT INTO users (nombre, identificacion, email, password_hash, rol, productor_id)
VALUES (
  'Administrador Sistema',
  '1234567890',
  'admin@pdia.com',
  '$2b$10$TBiNnDn2bpYcw9.0wvBtVuG1jGWc.uGH1CEqCCYEE6ldHVjtnQ8xG',
  'ADMINISTRADOR',
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Usuario Productor
INSERT INTO users (nombre, identificacion, email, password_hash, rol, productor_id)
VALUES (
  'Juan Productor',
  '1234567891',
  'productor@pdia.com',
  '$2b$10$X71loA9dLy2AF/6KeOaOieJD5gqsdCL3nUg7JCWzCj54juMmL3qSW',
  'PRODUCTOR',
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Usuario Técnico Agrónomo
INSERT INTO users (nombre, identificacion, email, password_hash, rol, productor_id)
VALUES (
  'María Técnica',
  '1234567893',
  'tecnico@pdia.com',
  '$2b$10$3rezbEl/N6g2CL9RvOpoP.pEpW.H/7Fh0OOs3gQ.Aq41fqPfnZUla',
  'TECNICO',
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Usuario Operario, vinculado al productor por email (robusto ante el orden de inserción)
INSERT INTO users (nombre, identificacion, email, password_hash, rol, productor_id)
SELECT
  'Pedro Operario',
  '1234567892',
  'operario@pdia.com',
  '$2b$10$z287djMqzqjMowHydjJe3.ouzneCTUI7Ibw4lnVHi978.6tRyLWtK',
  'OPERARIO',
  p.id
FROM users p
WHERE p.email = 'productor@pdia.com'
ON CONFLICT (email) DO NOTHING;
