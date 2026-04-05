# PDIA — Ejecución del Plan de Migración a Arquitectura en Capas

## 1. Alcance ejecutado en esta iteración

Se ejecutaron las fases iniciales del plan:

1. Base transversal de arquitectura en capas (backend).
2. Vertical slice completo del módulo Auth.
3. Conexión inicial del frontend al nuevo módulo Auth.

Este alcance deja una base funcional y consistente para que los siguientes módulos (Parcelas, Cultivos, Actividades, Clima) se implementen con el mismo patrón sin rehacer estructura.

## 2. Resultado arquitectónico logrado

### 2.1 Flujo por capas implementado

El backend ahora opera con este flujo:

1. `route` recibe endpoint y valida formato.
2. `controller` traduce HTTP a caso de uso.
3. `service` ejecuta reglas de negocio.
4. `repository` hace persistencia SQL.
5. `model` contiene entidad de dominio y DTOs.

Dependencias activas:

- `route -> controller -> service -> repository`
- `model` compartido por las capas
- `middleware` transversal para validación, autenticación y errores

### 2.2 Mapeo de archivos nuevos y su responsabilidad

#### Capa transversal (backend)

- `src/middleware/AppError.ts`
  - Excepción tipada de dominio/aplicación con `statusCode` y `details`.
- `src/middleware/ErrorHandler.ts`
  - Manejo global de errores y respuesta uniforme en JSON.
- `src/middleware/ValidationMiddleware.ts`
  - Integración con `express-validator`.
- `src/middleware/AuthMiddleware.ts`
  - Validación de JWT y carga de usuario autenticado en `req.authUser`.
- `src/config/api/ApiResponse.ts`
  - Estandarización de respuestas exitosas (`ok`, `created`).

#### Vertical slice Auth (backend)

- `src/app/finca/model/User.ts`
  - Entidad de dominio orientada a objetos con encapsulamiento.
- `src/app/finca/model/dto/AuthDto.ts`
  - Contratos tipados para `register`, `login`, `public user`, `auth response`.
- `src/app/finca/repository/AuthRepository.ts`
  - SQL de usuarios (buscar por email/id, crear, actualizar seguridad de login).
- `src/app/finca/service/AuthService.ts`
  - Reglas de negocio de autenticación.
- `src/app/finca/controller/AuthController.ts`
  - Controladores HTTP para `register`, `login`, `me`.
- `src/app/finca/route/AuthRoutes.ts`
  - Endpoints y validaciones de entrada.

#### Integración de servidor

- `src/config/api/Servidor.ts`
  - Registro de `helmet`, rutas de auth y middleware global de errores.
  - Endpoint raíz unificado en formato de respuesta consistente.

#### Ajustes de infraestructura

- `src/config/connection/dbConnetions.ts`
  - Compatibilidad de variables de entorno actual y estándar:
    - `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`
    - fallback a variables legadas.
- `backend/package.json`
  - Scripts corregidos:
    - `dev`: nodemon + ts-node sobre `src/index.ts`
    - `build`: compilación única `tsc`
    - `typecheck`: `tsc --noEmit`
    - `start`: `node build/index.js`

### 2.3 Integración en frontend

- `frontend/src/shared/services/apiClient.ts`
  - Cliente HTTP estandarizado con función `request`.
  - Métodos implementados:
    - `probarConexion`
    - `login`
    - `register`
    - `getProfile`
- `frontend/src/store/authStore.ts`
  - Estado de sesión extendido: token + usuario autenticado.
- `frontend/src/features/auth/pages/LoginPage.tsx`
  - Formulario funcional con validación (`zod`), llamada al backend y guardado de sesión.
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`
  - Ajuste al formato de respuesta estandarizado.

## 3. Endpoints implementados

Base URL backend: `http://localhost:3123`

### POST `/api/auth/register`

Body:

```json
{
  "nombre": "Juan Pérez",
  "identificacion": "123456789",
  "email": "juan@correo.com",
  "password": "12345678",
  "rol": "PRODUCTOR"
}
```

Respuesta exitosa:

```json
{
  "success": true,
  "message": "Usuario registrado correctamente",
  "data": {
    "token": "jwt...",
    "user": {
      "id": 1,
      "nombre": "Juan Pérez",
      "identificacion": "123456789",
      "email": "juan@correo.com",
      "rol": "PRODUCTOR"
    }
  }
}
```

### POST `/api/auth/login`

Body:

```json
{
  "email": "juan@correo.com",
  "password": "12345678"
}
```

Reglas activas:

- Credenciales inválidas -> 401
- Bloqueo tras 5 intentos fallidos -> 423 (15 minutos)

### GET `/api/auth/me`

Header:

```http
Authorization: Bearer <token>
```

Respuesta:

```json
{
  "success": true,
  "message": "Perfil obtenido correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "identificacion": "123456789",
    "email": "juan@correo.com",
    "rol": "PRODUCTOR"
  }
}
```

## 4. Reglas de negocio de Auth implementadas

1. Registro no permite correo duplicado.
2. Contraseñas se almacenan hasheadas (`bcryptjs`).
3. Login emite JWT.
4. Fallos de login acumulan intentos por usuario.
5. En quinto fallo la cuenta queda bloqueada temporalmente.
6. Login exitoso resetea intentos y bloqueo.
7. Endpoint de perfil requiere token válido.

## 5. Contrato de base de datos requerido para Auth

Para que Auth funcione sobre PostgreSQL, la tabla `users` debe existir con estos campos:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  identificacion VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 6. Variables de entorno mínimas

Backend (`pdia/backend/.env`):

```env
PORT=3123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdia
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=tu_clave_segura
JWT_EXPIRATION=7d
```

Frontend (`pdia/frontend/.env`):

```env
VITE_API_URL=http://localhost:3123
```

## 7. Guía de ejecución

Backend:

```bash
cd pdia/backend
npm install
npm run build
npm run dev
```

Frontend:

```bash
cd pdia/frontend
npm install
npm run dev
```

## 8. Qué quedó listo para la siguiente fase

La base en capas ya está operativa, por lo que Parcelas/Cultivos/Actividades pueden replicar el mismo patrón:

1. `model + dto`
2. `repository`
3. `service`
4. `controller`
5. `route`

Con esto se evita mezclar lógica de negocio en rutas y se mantiene trazabilidad por requisito.

## 9. Backlog técnico inmediato recomendado

1. Crear migraciones SQL para `users` y tablas núcleo de dominio.
2. Implementar módulo Parcelas como siguiente vertical slice.
3. Activar guards por rol (`PRODUCTOR`, `OPERARIO`, etc.).
4. Añadir pruebas automatizadas de Auth (mínimo flujos happy-path y errores).
5. Persistir sesión en frontend para recarga de página.

## 10. Actualización iteración 2 — APIs de Parcelas y Cultivos

En esta iteración se implementaron dos módulos adicionales completos en arquitectura en capas:

- Parcelas
- Cultivos

### 10.1 Infraestructura agregada

Se agregó inicialización automática del esquema base en arranque backend:

- `src/config/connection/initSchema.ts`

Tablas ahora garantizadas:

- `users`
- `parcelas`
- `cultivos`

### 10.2 Endpoints nuevos — Parcelas

Todas las rutas requieren JWT (`Authorization: Bearer <token>`):

- `GET /api/parcelas` -> listar parcelas del productor autenticado.
- `GET /api/parcelas/:id` -> detalle de parcela del productor autenticado.
- `POST /api/parcelas` -> crear parcela.
- `PUT /api/parcelas/:id` -> actualizar parcela.
- `DELETE /api/parcelas/:id` -> eliminar parcela.

Body creación:

```json
{
  "nombre": "Parcela Norte",
  "municipio": "Santa Marta",
  "hectareas": 2.5,
  "latitud": 11.2408,
  "longitud": -74.199
}
```

### 10.3 Endpoints nuevos — Cultivos

Todas las rutas requieren JWT (`Authorization: Bearer <token>`):

- `GET /api/cultivos` -> listar cultivos del productor autenticado.
- `GET /api/cultivos?tipoCultivo=maiz` -> búsqueda por tipo.
- `GET /api/cultivos/:id` -> detalle.
- `POST /api/cultivos` -> crear cultivo.
- `PUT /api/cultivos/:id` -> actualizar cultivo.
- `DELETE /api/cultivos/:id` -> eliminar cultivo.

Body creación:

```json
{
  "tipoCultivo": "Maiz",
  "fechaSiembra": "2026-04-01",
  "estado": "EN_CRECIMIENTO",
  "observaciones": "Lote inicial",
  "parcelaId": 1
}
```

Estados válidos:

- `EN_CRECIMIENTO`
- `COSECHADO`
- `AFECTADO`

### 10.4 Reglas de negocio aplicadas

- El productor solo puede ver/editar/eliminar sus propias parcelas.
- El productor solo puede crear cultivos sobre parcelas que le pertenecen.
- El productor solo puede ver/editar/eliminar cultivos asociados a sus parcelas.
- Eliminación de parcela elimina cultivos asociados por `ON DELETE CASCADE`.

### 10.5 Verificación ejecutada en esta iteración

- `npm run typecheck` en backend -> OK
- `npm run build` en backend -> OK
- Flujo HTTP validado:
  1. Registro de usuario
  2. Login con token
  3. Creación de parcela autenticada
  4. Creación de cultivo autenticada
  5. Listado de cultivos por productor

Resultado de validación automática:

```json
{
  "register": true,
  "parcela": true,
  "cultivo": true,
  "totalCultivos": 1
}
```
