# Reestructuración del Modelo de Dominio PDIA

## TL;DR

> **Quick Summary**: Introducir la entidad Finca entre Usuario y Parcela, e implementar gestión completa de operarios (asignación a parcelas, vistas filtradas por rol).
> 
> **Deliverables**:
> - Nueva entidad Finca con CRUD completo (backend + frontend)
> - Modificación de Parcela para pertenecer a Finca (no directo a Usuario)
> - Sistema de asignación operario-parcela
> - Filtrado de vistas por rol (operario solo ve parcelas asignadas)
> - Navegación adaptada por rol
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Schema BD → Modelos Backend → Servicios → Frontend

---

## Context

### Original Request
El modelo actual `Usuario → Parcela → Cultivo` está incorrecto. La arquitectura correcta es:
- 1 agricultor tiene 1 o varias **fincas**
- Cada finca puede tener 1 o varias **parcelas**
- Cada parcela puede tener 1 o varios **cultivos**
- Los operarios se asignan a parcelas específicas

### Interview Summary
**Key Discussions**:
- **Atributos Finca**: nombre, ubicacion (texto), descripcion, area, tipoFinca (enum), fechaRegistro, codigoICA
- **tipoFinca enum**: AGRICOLA, GANADERA, MIXTA, FORESTAL
- **No hay datos existentes**: esquema limpio, sin migración de datos
- **Operarios**: solo pueden registrar actividades (no CRUD de cultivos)
- **Vista operario**: lista plana de parcelas asignadas (sin navegación por fincas)

**Research Findings**:
- Parcela actual tiene `productor_id` directo a `users` → debe cambiar a `finca_id`
- No existe tabla de asignación operario-parcela
- RF69 (login operario) ya funciona
- Servicios actuales solo filtran por `productorId`

### Metis Review
**Identified Gaps** (addressed):
- Tipo de dato de ubicación: **Texto simple** (confirmado)
- Valores de tipoFinca: **Enum AGRICOLA|GANADERA|MIXTA|FORESTAL** (confirmado)
- Permisos operario: **Solo registrar actividades** (confirmado)
- Vista operario: **Lista plana de parcelas** (confirmado)
- Cascading deletes: **Aplicar ON DELETE CASCADE** (default aplicado)

---

## Work Objectives

### Core Objective
Reestructurar el modelo de dominio a `Usuario → Finca → Parcela → Cultivo` e implementar gestión de operarios con control de acceso por rol.

### Concrete Deliverables
- Tabla `fincas` en PostgreSQL con todos los atributos
- Tabla `asignacion_operarios` para relación many-to-many
- Modelo, servicio, controlador, rutas de Finca (backend)
- Modelo, servicio, controlador, rutas de Operarios (backend)
- Modificación de Parcela (finca_id en lugar de productor_id)
- Modificación de servicios existentes para filtrar por rol
- Página FincasPage y formularios (frontend)
- Página OperariosPage y gestión de asignaciones (frontend)
- Navegación filtrada por rol

### Definition of Done
- [ ] `bun run build` completa sin errores (backend)
- [ ] `bun run dev` levanta servidor sin errores (frontend)
- [ ] Productor puede crear fincas, parcelas y asignar operarios
- [ ] Operario solo ve parcelas asignadas
- [ ] Operario puede registrar actividades en parcelas asignadas

### Must Have
- Entidad Finca con CRUD completo
- Tabla asignacion_operarios
- Filtrado de parcelas por rol
- UI para gestionar operarios y asignaciones

### Must NOT Have (Guardrails)
- ❌ NO usar NestJS (entregable 2 usa Express puro)
- ❌ NO implementar analytics de fincas
- ❌ NO implementar permisos avanzados más allá de PRODUCTOR/OPERARIO
- ❌ NO migrar datos existentes (esquema limpio)
- ❌ NO permitir a operarios crear/editar/eliminar cultivos
- ❌ NO mostrar fincas en la navegación del operario

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (proyecto sin tests configurados)
- **Automated tests**: NO (enfoque en Agent-Executed QA)
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Frontend/UI**: Use Playwright - Navigate, interact, assert DOM, screenshot

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Schema + Types):
├── Task 1: Actualizar esquema SQL (fincas, asignacion_operarios, modificar parcelas) [quick]
├── Task 2: Crear modelo Finca.ts + FincaPersistence [quick]
├── Task 3: Crear modelo AsignacionOperario.ts [quick]
├── Task 4: Crear DTOs (FincaDto, OperarioDto) [quick]
└── Task 5: Actualizar modelo Parcela.ts (fincaId en lugar de productorId) [quick]

Wave 2 (Backend Core - Repositories + Services):
├── Task 6: Implementar FincaRepository (CRUD) [quick]
├── Task 7: Implementar AsignacionRepository [quick]
├── Task 8: Implementar FincaService [unspecified-high]
├── Task 9: Implementar OperarioService (RF66, RF67, RF68, RF71) [unspecified-high]
├── Task 10: Modificar ParcelaRepository (fincaId) [quick]
└── Task 11: Modificar ParcelaService + CultivoService + ActividadService (filtro por rol) [deep]

Wave 3 (Backend API + Frontend Core):
├── Task 12: Implementar FincaController + FincaRoutes [quick]
├── Task 13: Implementar OperarioController + OperarioRoutes [quick]
├── Task 14: Modificar ParcelaController (crear parcela requiere fincaId) [quick]
├── Task 15: Crear middleware RoleMiddleware [quick]
├── Task 16: Actualizar modelos y apiClient frontend [quick]
├── Task 17: Crear FincasPage + FincaForm [visual-engineering]
└── Task 18: Crear OperariosPage + AsignarOperarioModal [visual-engineering]

Wave 4 (Integration + Refactor):
├── Task 19: Modificar ParcelsPage (selector de finca) [visual-engineering]
├── Task 20: Modificar CropsPage (compatible con nueva jerarquía) [quick]
├── Task 21: Implementar navegación por rol [quick]
├── Task 22: Vista de operario (parcelas asignadas) [visual-engineering]
└── Task 23: Registrar nuevas rutas en Servidor.ts + App.tsx [quick]

Wave FINAL (Verification - 4 parallel reviews):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real manual QA [unspecified-high]
└── Task F4: Scope fidelity check [deep]
-> Present results -> Get explicit user okay
```

### Dependency Matrix
- **1-5**: - → 6-11, Wave 1
- **6-11**: 1-5 → 12-18, Wave 2
- **12-18**: 6-11 → 19-23, Wave 3
- **19-23**: 12-18 → F1-F4, Wave 4
- **F1-F4**: 19-23 → user okay, Final

### Agent Dispatch Summary
- **Wave 1**: 5 tasks - T1-T5 → `quick`
- **Wave 2**: 6 tasks - T6-T7,T10 → `quick`, T8-T9 → `unspecified-high`, T11 → `deep`
- **Wave 3**: 7 tasks - T12-T16 → `quick`, T17-T18 → `visual-engineering`
- **Wave 4**: 5 tasks - T19,T22 → `visual-engineering`, T20-T21,T23 → `quick`
- **Final**: 4 tasks - F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Actualizar esquema SQL (fincas, asignacion_operarios, modificar parcelas)

  **What to do**:
  - Crear tabla `fincas` con columnas: id (SERIAL PK), nombre (VARCHAR 120), ubicacion (VARCHAR 200), descripcion (TEXT NULL), area (NUMERIC 10,2), tipo_finca (VARCHAR 30 CHECK IN AGRICOLA|GANADERA|MIXTA|FORESTAL), codigo_ica (VARCHAR 50 NULL), propietario_id (FK users ON DELETE CASCADE), created_at, updated_at
  - Crear tabla `asignacion_operarios` con: id (SERIAL PK), operario_id (FK users), parcela_id (FK parcelas), asignado_por_id (FK users), fecha_asignacion (TIMESTAMP), UNIQUE(operario_id, parcela_id)
  - Modificar tabla `parcelas`: DROP COLUMN productor_id, ADD COLUMN finca_id (FK fincas ON DELETE CASCADE)
  - Crear índices: idx_fincas_propietario_id, idx_asignacion_operario_id, idx_asignacion_parcela_id, idx_parcelas_finca_id

  **Must NOT do**:
  - NO crear migración de datos (esquema limpio)
  - NO modificar otras tablas existentes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 6-11
  - **Blocked By**: None

  **References**:
  - `backend/sql/init_pdia.sql` - Esquema actual, seguir el mismo patrón de CREATE TABLE
  - `backend/src/config/connection/initSchema.ts` - Script que ejecuta el SQL, actualizar si es necesario

  **Acceptance Criteria**:
  - [ ] Archivo `init_pdia.sql` contiene CREATE TABLE fincas con todos los campos
  - [ ] Archivo `init_pdia.sql` contiene CREATE TABLE asignacion_operarios
  - [ ] Tabla parcelas ya no tiene productor_id, tiene finca_id
  - [ ] Todos los índices creados

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar sintaxis SQL válida
    Tool: Bash
    Preconditions: PostgreSQL disponible
    Steps:
      1. psql -U postgres -c "\i backend/sql/init_pdia.sql" (o ejecutar con bun)
      2. Verificar que no hay errores de sintaxis
      3. psql -c "\d fincas" para ver estructura
      4. psql -c "\d asignacion_operarios" para ver estructura
      5. psql -c "\d parcelas" para verificar finca_id existe
    Expected Result: Todas las tablas creadas sin errores, FK correctas
    Evidence: .sisyphus/evidence/task-1-schema-created.txt
  ```

  **Commit**: YES
  - Message: `feat(schema): add fincas and asignacion_operarios tables, refactor parcelas`
  - Files: `backend/sql/init_pdia.sql`, `backend/src/config/connection/initSchema.ts`

- [ ] 2. Crear modelo Finca.ts + FincaPersistence

  **What to do**:
  - Crear interface `FincaPersistence` con atributos snake_case de BD
  - Crear clase `Finca` con atributos privados y getters públicos
  - Definir enum `TipoFinca = 'AGRICOLA' | 'GANADERA' | 'MIXTA' | 'FORESTAL'`
  - Constructor recibe `FincaPersistence` y mapea a camelCase

  **Must NOT do**:
  - NO agregar métodos de lógica de negocio (modelo anémico como los existentes)
  - NO usar setters (inmutabilidad)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6, 8
  - **Blocked By**: None

  **References**:
  - `backend/src/app/finca/model/Parcela.ts:1-50` - Patrón de modelo OO a seguir
  - `backend/src/app/finca/model/User.ts:1-60` - Patrón de interface Persistence + clase

  **Acceptance Criteria**:
  - [ ] Archivo `backend/src/app/finca/model/Finca.ts` existe
  - [ ] Interface FincaPersistence con: id, nombre, ubicacion, descripcion, area, tipo_finca, codigo_ica, propietario_id, created_at, updated_at
  - [ ] Clase Finca con getters para todos los atributos
  - [ ] Enum TipoFinca exportado

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar compilación del modelo
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. Verificar que no hay errores de TypeScript
    Expected Result: Build exitoso sin errores
    Evidence: .sisyphus/evidence/task-2-finca-model.txt
  ```

  **Commit**: NO (agrupa con Wave 1)

- [ ] 3. Crear modelo AsignacionOperario.ts

  **What to do**:
  - Crear interface `AsignacionOperarioPersistence` con atributos de BD
  - Crear clase `AsignacionOperario` con atributos: id, operarioId, parcelaId, asignadoPorId, fechaAsignacion
  - Constructor recibe persistence y mapea

  **Must NOT do**:
  - NO incluir objetos anidados (User, Parcela) - solo IDs

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 7, 9
  - **Blocked By**: None

  **References**:
  - `backend/src/app/finca/model/Actividad.ts:1-50` - Patrón similar con múltiples FKs

  **Acceptance Criteria**:
  - [ ] Archivo `backend/src/app/finca/model/AsignacionOperario.ts` existe
  - [ ] Interface y clase con todos los atributos requeridos

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar compilación
    Tool: Bash
    Steps:
      1. cd backend && bun run build
    Expected Result: Build exitoso
    Evidence: .sisyphus/evidence/task-3-asignacion-model.txt
  ```

  **Commit**: NO (agrupa con Wave 1)

- [ ] 4. Crear DTOs (FincaDto, OperarioDto)

  **What to do**:
  - Crear `FincaDto.ts` con: CreateFincaDto, UpdateFincaDto, FincaResponseDto
  - Crear `OperarioDto.ts` con: RegisterOperarioDto, AsignarOperarioDto, OperarioConParcelasDto
  - Usar class-validator para validaciones si está disponible, o validación manual

  **Must NOT do**:
  - NO usar decoradores de NestJS

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8, 9, 12, 13
  - **Blocked By**: None

  **References**:
  - `backend/src/app/finca/model/dto/ParcelaDto.ts` - Patrón de DTO existente
  - `backend/src/app/finca/model/dto/CultivoDto.ts` - Patrón de DTO existente

  **Acceptance Criteria**:
  - [ ] `backend/src/app/finca/model/dto/FincaDto.ts` con Create, Update, Response
  - [ ] `backend/src/app/finca/model/dto/OperarioDto.ts` con Register, Asignar, ConParcelas
  - [ ] Build sin errores

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar estructura DTOs
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. Verificar que archivos DTO existen
    Expected Result: Build exitoso, archivos existen
    Evidence: .sisyphus/evidence/task-4-dtos.txt
  ```

  **Commit**: NO (agrupa con Wave 1)

- [ ] 5. Actualizar modelo Parcela.ts (fincaId en lugar de productorId)

  **What to do**:
  - Modificar `ParcelaPersistence` interface: quitar `productor_id`, agregar `finca_id`
  - Modificar clase `Parcela`: quitar `productorId` getter, agregar `fincaId` getter
  - Actualizar constructor para mapear finca_id → fincaId

  **Must NOT do**:
  - NO romper la estructura existente de otros atributos
  - NO agregar validaciones de negocio en el modelo

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 10, 14
  - **Blocked By**: None

  **References**:
  - `backend/src/app/finca/model/Parcela.ts` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] Parcela ya no tiene productorId
  - [ ] Parcela tiene fincaId
  - [ ] Build sin errores

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar cambio de FK
    Tool: Bash
    Steps:
      1. grep -r "productorId" backend/src/app/finca/model/Parcela.ts (debe estar vacío)
      2. grep -r "fincaId" backend/src/app/finca/model/Parcela.ts (debe encontrar)
      3. cd backend && bun run build
    Expected Result: productorId no existe, fincaId existe, build pasa
    Evidence: .sisyphus/evidence/task-5-parcela-refactor.txt
  ```

  **Commit**: YES (fin de Wave 1)
  - Message: `feat(models): add Finca, AsignacionOperario models and refactor Parcela`
  - Files: Todos los modelos nuevos/modificados

- [ ] 6. Implementar FincaRepository (CRUD)

  **What to do**:
  - Crear `FincaRepository.ts` con métodos: create, findById, findByPropietarioId, update, delete
  - Usar el pool de conexión existente (`dbConnections.ts`)
  - Mapear resultados a `FincaPersistence` → `Finca`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10, 11)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `backend/src/app/finca/repository/ParcelaRepository.ts` - Patrón de repository existente
  - `backend/src/config/connection/dbConnetions.ts` - Pool de conexión

  **Acceptance Criteria**:
  - [ ] Archivo `backend/src/app/finca/repository/FincaRepository.ts` existe
  - [ ] Métodos CRUD implementados
  - [ ] Build sin errores

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar estructura del repository
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. Verificar que FincaRepository existe y exporta métodos CRUD
    Expected Result: Build pasa, métodos exportados
    Evidence: .sisyphus/evidence/task-6-finca-repo.txt
  ```

  **Commit**: NO (agrupa con Wave 2)

- [ ] 7. Implementar AsignacionRepository

  **What to do**:
  - Crear `AsignacionRepository.ts` con métodos:
    - `asignar(operarioId, parcelaId, asignadoPorId)` - INSERT
    - `desasignar(operarioId, parcelaId)` - DELETE
    - `findByOperarioId(operarioId)` - Lista parcelas asignadas
    - `findByParcelaId(parcelaId)` - Lista operarios de una parcela
    - `existeAsignacion(operarioId, parcelaId)` - Verificar si existe
    - `findByProductorId(productorId)` - Listar todas las asignaciones del productor (RF71)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9, 11
  - **Blocked By**: Tasks 1, 3

  **References**:
  - `backend/src/app/finca/repository/ActividadRepository.ts` - Patrón con múltiples queries

  **Acceptance Criteria**:
  - [ ] Archivo `backend/src/app/finca/repository/AsignacionRepository.ts` existe
  - [ ] Todos los métodos requeridos implementados

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar métodos del repository
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. grep -E "asignar|desasignar|findByOperarioId" backend/src/app/finca/repository/AsignacionRepository.ts
    Expected Result: Métodos encontrados, build pasa
    Evidence: .sisyphus/evidence/task-7-asignacion-repo.txt
  ```

  **Commit**: NO (agrupa con Wave 2)

- [ ] 8. Implementar FincaService

  **What to do**:
  - Crear `FincaService.ts` con métodos:
    - `create(dto, propietarioId)` - Crear finca validando que el usuario es PRODUCTOR
    - `findById(id, userId)` - Obtener finca verificando propiedad
    - `findByPropietario(propietarioId)` - Listar fincas del productor
    - `update(id, dto, userId)` - Actualizar verificando propiedad
    - `delete(id, userId)` - Eliminar verificando propiedad
  - Validar que solo PRODUCTORES pueden crear/modificar fincas

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 2, 4, 6

  **References**:
  - `backend/src/app/finca/service/ParcelaService.ts` - Patrón de service con validación de propiedad

  **Acceptance Criteria**:
  - [ ] FincaService implementado con validación de rol PRODUCTOR
  - [ ] Verificación de propiedad en update/delete

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar lógica de servicio
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. grep "PRODUCTOR" backend/src/app/finca/service/FincaService.ts
    Expected Result: Validación de rol presente
    Evidence: .sisyphus/evidence/task-8-finca-service.txt
  ```

  **Commit**: NO (agrupa con Wave 2)

- [ ] 9. Implementar OperarioService (RF66, RF67, RF68, RF71)

  **What to do**:
  - Crear `OperarioService.ts` con métodos:
    - `registerOperario(dto, productorId)` - RF66: Registrar operario (crear usuario con rol OPERARIO)
    - `asignarAParcela(operarioId, parcelaId, productorId)` - RF67: Asignar operario, validar que parcela pertenece al productor
    - `desasignarDeParcela(operarioId, parcelaId, productorId)` - RF68: Desasignar
    - `listarOperariosConParcelas(productorId)` - RF71: Lista de operarios con sus parcelas
  - Validar que solo PRODUCTORES pueden registrar/asignar operarios
  - Validar que la parcela pertenece a una finca del productor antes de asignar

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 3, 4, 7

  **References**:
  - `backend/src/app/finca/service/AuthService.ts:150-200` - Lógica de registro de usuario
  - `AGENTS.md` líneas RF66-RF71 - Requisitos funcionales

  **Acceptance Criteria**:
  - [ ] Métodos para RF66, RF67, RF68, RF71 implementados
  - [ ] Validación de propiedad de parcela antes de asignar

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar métodos de operario
    Tool: Bash
    Steps:
      1. cd backend && bun run build
      2. grep -E "registerOperario|asignarAParcela|desasignarDeParcela|listarOperarios" backend/src/app/finca/service/OperarioService.ts
    Expected Result: Todos los métodos encontrados
    Evidence: .sisyphus/evidence/task-9-operario-service.txt
  ```

  **Commit**: NO (agrupa con Wave 2)

- [ ] 10. Modificar ParcelaRepository (fincaId)

  **What to do**:
  - Actualizar todas las queries: cambiar `productor_id` por `finca_id`
  - Actualizar método `create` para recibir `fincaId` en lugar de `productorId`
  - Actualizar método `findByProductorId` a `findByFincaId`
  - Agregar método `findByProductorIdViaFinca` que hace JOIN con fincas

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11, 14
  - **Blocked By**: Tasks 1, 5

  **References**:
  - `backend/src/app/finca/repository/ParcelaRepository.ts` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] Queries usan finca_id
  - [ ] Método findByFincaId existe

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar cambio de FK en queries
    Tool: Bash
    Steps:
      1. grep "productor_id" backend/src/app/finca/repository/ParcelaRepository.ts (debe estar vacío o en comentarios)
      2. grep "finca_id" backend/src/app/finca/repository/ParcelaRepository.ts (debe encontrar)
    Expected Result: finca_id en queries, productor_id eliminado
    Evidence: .sisyphus/evidence/task-10-parcela-repo.txt
  ```

  **Commit**: NO (agrupa con Wave 2)

- [ ] 11. Modificar ParcelaService + CultivoService + ActividadService (filtro por rol)

  **What to do**:
  - **ParcelaService.list(userId, rol)**:
    - Si rol = PRODUCTOR: obtener parcelas de todas sus fincas
    - Si rol = OPERARIO: obtener solo parcelas asignadas (via AsignacionRepository)
  - **CultivoService.list(userId, rol)**:
    - Si rol = PRODUCTOR: obtener cultivos de sus parcelas
    - Si rol = OPERARIO: obtener cultivos solo de parcelas asignadas
  - **ActividadService.create(dto, userId, rol)**:
    - Si rol = PRODUCTOR: validar que cultivo pertenece a sus parcelas
    - Si rol = OPERARIO: validar que parcela del cultivo está asignada al operario
  - Recibir `rol` del `req.authUser.rol` en controladores

  **Must NOT do**:
  - NO permitir a operarios crear/editar/eliminar cultivos (solo actividades)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12-15, 19-22
  - **Blocked By**: Tasks 7, 10

  **References**:
  - `backend/src/app/finca/service/ParcelaService.ts` - Archivo a modificar
  - `backend/src/app/finca/service/CultivoService.ts` - Archivo a modificar
  - `backend/src/app/finca/service/ActividadService.ts` - Archivo a modificar
  - `backend/src/middleware/AuthMiddleware.ts:30-40` - Cómo obtener rol del token

  **Acceptance Criteria**:
  - [ ] ParcelaService.list filtra por rol
  - [ ] CultivoService.list filtra por rol
  - [ ] ActividadService.create valida acceso por rol
  - [ ] Operario NO puede crear/editar cultivos

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar filtrado por rol en ParcelaService
    Tool: Bash
    Steps:
      1. grep -E "OPERARIO|PRODUCTOR" backend/src/app/finca/service/ParcelaService.ts
      2. grep "AsignacionRepository" backend/src/app/finca/service/ParcelaService.ts
    Expected Result: Lógica de filtrado por rol presente
    Evidence: .sisyphus/evidence/task-11-role-filter.txt

  Scenario: Verificar restricción de operario en CultivoService
    Tool: Bash
    Steps:
      1. grep -E "create.*OPERARIO|OPERARIO.*create" backend/src/app/finca/service/CultivoService.ts
    Expected Result: Restricción para operarios en create/update/delete
    Evidence: .sisyphus/evidence/task-11-operario-restriction.txt
  ```

  **Commit**: YES (fin de Wave 2)
  - Message: `feat(services): implement finca, operario services and role-based filtering`
  - Files: Todos los services nuevos/modificados

- [ ] 12. Implementar FincaController + FincaRoutes

  **What to do**:
  - Crear `FincaController.ts` con handlers:
    - `POST /` - Crear finca
    - `GET /` - Listar fincas del productor
    - `GET /:id` - Obtener finca por ID
    - `PUT /:id` - Actualizar finca
    - `DELETE /:id` - Eliminar finca
  - Crear `FincaRoutes.ts` con las rutas protegidas por RequireAuth
  - Usar ApiResponse para respuestas consistentes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13-18)
  - **Blocks**: Task 23
  - **Blocked By**: Task 8

  **References**:
  - `backend/src/app/finca/controller/ParcelaController.ts` - Patrón de controller
  - `backend/src/app/finca/route/ParcelaRoutes.ts` - Patrón de routes
  - `backend/src/config/api/ApiResponse.ts` - Helper de respuestas

  **Acceptance Criteria**:
  - [ ] Endpoints CRUD de finca funcionando
  - [ ] Rutas protegidas con RequireAuth

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Crear finca via API
    Tool: Bash (curl)
    Preconditions: Servidor corriendo, token JWT de productor disponible
    Steps:
      1. curl -X POST http://localhost:3000/api/fincas -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nombre":"Finca La Esperanza","ubicacion":"Santa Marta","area":50,"tipoFinca":"AGRICOLA"}'
      2. Verificar status 201
      3. Verificar que response tiene id, nombre, propietarioId
    Expected Result: 201 Created con datos de la finca
    Evidence: .sisyphus/evidence/task-12-finca-create.json
  ```

  **Commit**: NO (agrupa con Wave 3)

- [ ] 13. Implementar OperarioController + OperarioRoutes

  **What to do**:
  - Crear `OperarioController.ts` con handlers:
    - `POST /` - RF66: Registrar operario
    - `GET /` - RF71: Listar operarios con sus parcelas
    - `POST /asignaciones` - RF67: Asignar operario a parcela
    - `DELETE /asignaciones/:operarioId/:parcelaId` - RF68: Desasignar
  - Crear `OperarioRoutes.ts` protegidas por RequireAuth + validación de rol PRODUCTOR

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 23
  - **Blocked By**: Task 9

  **References**:
  - `backend/src/app/finca/controller/AuthController.ts` - Patrón para registro
  - `AGENTS.md` RF66-RF71 - Requisitos funcionales

  **Acceptance Criteria**:
  - [ ] Endpoint para registrar operario (RF66)
  - [ ] Endpoint para asignar/desasignar (RF67, RF68)
  - [ ] Endpoint para listar operarios con parcelas (RF71)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Registrar operario via API (RF66)
    Tool: Bash (curl)
    Preconditions: Token JWT de productor
    Steps:
      1. curl -X POST http://localhost:3000/api/operarios -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"nombre":"Juan Operario","identificacion":"123456","email":"operario@test.com","password":"Pass123!"}'
      2. Verificar status 201
      3. Verificar que response tiene rol = "OPERARIO"
    Expected Result: 201 Created, operario con rol OPERARIO
    Evidence: .sisyphus/evidence/task-13-register-operario.json

  Scenario: Asignar operario a parcela (RF67)
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/api/operarios/asignaciones -H "Authorization: Bearer $TOKEN" -d '{"operarioId":2,"parcelaId":1}'
      2. Verificar status 201
    Expected Result: 201 Created
    Evidence: .sisyphus/evidence/task-13-assign-operario.json
  ```

  **Commit**: NO (agrupa con Wave 3)

- [ ] 14. Modificar ParcelaController (crear parcela requiere fincaId)

  **What to do**:
  - Actualizar `POST /parcelas` para requerir `fincaId` en el body
  - Validar que la finca pertenece al productor antes de crear la parcela
  - Actualizar `GET /parcelas` para incluir info de finca si es útil
  - Remover cualquier referencia a `productorId` en los endpoints

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 19
  - **Blocked By**: Tasks 5, 10, 11

  **References**:
  - `backend/src/app/finca/controller/ParcelaController.ts` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] Crear parcela requiere fincaId
  - [ ] Validación de propiedad de finca

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Crear parcela con fincaId
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/api/parcelas -H "Authorization: Bearer $TOKEN" -d '{"nombre":"Parcela Norte","fincaId":1,"hectareas":10,"latitud":11.2,"longitud":-74.1,"municipio":"Santa Marta"}'
      2. Verificar status 201
      3. Verificar que response tiene fincaId
    Expected Result: 201 Created con fincaId
    Evidence: .sisyphus/evidence/task-14-parcela-finca.json

  Scenario: Error al crear parcela sin fincaId
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/api/parcelas -H "Authorization: Bearer $TOKEN" -d '{"nombre":"Parcela Sin Finca","hectareas":10}'
      2. Verificar status 400
    Expected Result: 400 Bad Request
    Evidence: .sisyphus/evidence/task-14-parcela-error.json
  ```

  **Commit**: NO (agrupa con Wave 3)

- [ ] 15. Crear middleware RoleMiddleware

  **What to do**:
  - Crear `RoleMiddleware.ts` con función `RequireRole(roles: string[])`
  - Verificar que `req.authUser.rol` está en la lista de roles permitidos
  - Retornar 403 Forbidden si el rol no está permitido
  - Usar después de RequireAuth en las rutas que lo necesiten

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Ninguno directo (usado por otros)
  - **Blocked By**: Task 11

  **References**:
  - `backend/src/middleware/AuthMiddleware.ts` - Patrón de middleware existente

  **Acceptance Criteria**:
  - [ ] Middleware `RequireRole(['PRODUCTOR'])` funciona
  - [ ] Retorna 403 si rol no permitido

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Operario intenta acceder a ruta de productor
    Tool: Bash (curl)
    Preconditions: Token JWT de operario
    Steps:
      1. curl -X POST http://localhost:3000/api/operarios -H "Authorization: Bearer $OPERARIO_TOKEN" -d '...'
      2. Verificar status 403
    Expected Result: 403 Forbidden
    Evidence: .sisyphus/evidence/task-15-role-forbidden.json
  ```

  **Commit**: NO (agrupa con Wave 3)

- [ ] 16. Actualizar modelos y apiClient frontend

  **What to do**:
  - Actualizar `frontend/src/shared/models/Parcel.ts`: quitar productorId, agregar fincaId
  - Crear `frontend/src/shared/models/Finca.ts` con interface
  - Actualizar `frontend/src/shared/services/apiClient.ts`:
    - Agregar `FincaDto`, `CreateFincaPayload`, etc.
    - Agregar `apiClient.fincas.*` (list, get, create, update, delete)
    - Agregar `apiClient.operarios.*` (list, register, assign, unassign)
  - Actualizar `validators.ts` con `fincaSchema`, `operarioSchema`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 17-22
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `frontend/src/shared/services/apiClient.ts` - Archivo a modificar
  - `frontend/src/shared/models/Parcel.ts` - Archivo a modificar
  - `frontend/src/shared/utils/validators.ts` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] apiClient.fincas.* métodos disponibles
  - [ ] apiClient.operarios.* métodos disponibles
  - [ ] Parcel model tiene fincaId

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar compilación frontend
    Tool: Bash
    Steps:
      1. cd frontend && bun run build
    Expected Result: Build exitoso
    Evidence: .sisyphus/evidence/task-16-frontend-build.txt
  ```

  **Commit**: NO (agrupa con Wave 3)

- [ ] 17. Crear FincasPage + FincaForm

  **What to do**:
  - Crear `frontend/src/features/fincas/pages/FincasPage.tsx`:
    - Lista de fincas del productor con Cards
    - Botón "Nueva Finca" que abre modal
    - Acciones: editar, eliminar por finca
    - Mostrar: nombre, ubicación, área, tipo, código ICA
  - Crear `frontend/src/shared/components/common/FincaForm.tsx`:
    - Modal para crear/editar finca
    - Campos: nombre, ubicación, descripción, área, tipoFinca (dropdown), códigoICA
    - Validación con Zod

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Task 16

  **References**:
  - `frontend/src/features/parcels/pages/ParcelsPage.tsx` - Patrón de página CRUD
  - `frontend/src/shared/components/common/ParcelForm.tsx` - Patrón de formulario modal

  **Acceptance Criteria**:
  - [ ] FincasPage muestra lista de fincas
  - [ ] FincaForm permite crear/editar
  - [ ] Dropdown para tipoFinca con AGRICOLA|GANADERA|MIXTA|FORESTAL

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Ver lista de fincas
    Tool: Playwright
    Preconditions: Usuario productor logueado con fincas
    Steps:
      1. Navegar a /fincas
      2. Esperar que cargue la lista
      3. Verificar que existe al menos una card de finca
      4. Screenshot
    Expected Result: Cards de fincas visibles
    Evidence: .sisyphus/evidence/task-17-fincas-list.png

  Scenario: Crear nueva finca
    Tool: Playwright
    Steps:
      1. Click en botón "Nueva Finca"
      2. Llenar formulario: nombre="Finca Test", ubicacion="Santa Marta", area=100, tipoFinca="AGRICOLA"
      3. Click en "Guardar"
      4. Verificar toast de éxito o finca en la lista
    Expected Result: Finca creada y visible en lista
    Evidence: .sisyphus/evidence/task-17-finca-create.png
  ```

  **Commit**: NO (agrupa con Wave 3)

- [ ] 18. Crear OperariosPage + AsignarOperarioModal

  **What to do**:
  - Crear `frontend/src/features/operarios/pages/OperariosPage.tsx`:
    - Lista de operarios con sus parcelas asignadas (RF71)
    - Botón "Registrar Operario" que abre modal
    - Por cada operario: botón para asignar a más parcelas
  - Crear `frontend/src/shared/components/common/OperarioForm.tsx`:
    - Modal para registrar operario (RF66)
    - Campos: nombre, identificación, email, contraseña
  - Crear `frontend/src/shared/components/common/AsignarOperarioModal.tsx`:
    - Modal con dropdown de parcelas disponibles
    - Botón asignar (RF67)
    - Lista de parcelas ya asignadas con botón desasignar (RF68)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 21
  - **Blocked By**: Task 16

  **References**:
  - `frontend/src/features/parcels/pages/ParcelsPage.tsx` - Patrón de página
  - `AGENTS.md` RF66-RF71 - Requisitos funcionales

  **Acceptance Criteria**:
  - [ ] Lista de operarios visible (RF71)
  - [ ] Formulario para registrar operario (RF66)
  - [ ] Modal para asignar/desasignar parcelas (RF67, RF68)

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Registrar operario (RF66)
    Tool: Playwright
    Preconditions: Usuario productor logueado
    Steps:
      1. Navegar a /operarios
      2. Click "Registrar Operario"
      3. Llenar: nombre="Juan", identificacion="123", email="juan@test.com", password="Pass123!"
      4. Click "Guardar"
      5. Verificar que aparece en la lista
    Expected Result: Operario registrado y visible
    Evidence: .sisyphus/evidence/task-18-register-operario.png

  Scenario: Asignar operario a parcela (RF67)
    Tool: Playwright
    Preconditions: Operario y parcela existentes
    Steps:
      1. En la lista de operarios, click "Asignar" en un operario
      2. Seleccionar parcela del dropdown
      3. Click "Asignar"
      4. Verificar que la parcela aparece bajo el operario
    Expected Result: Parcela asignada visible
    Evidence: .sisyphus/evidence/task-18-assign-operario.png
  ```

  **Commit**: YES (fin de Wave 3)
  - Message: `feat(api+frontend): add finca and operario endpoints and pages`
  - Files: Todos los archivos de Wave 3

- [ ] 19. Modificar ParcelsPage (selector de finca)

  **What to do**:
  - Actualizar `frontend/src/features/parcels/pages/ParcelsPage.tsx`:
    - Cargar fincas además de parcelas
    - Mostrar a qué finca pertenece cada parcela
    - Opcionalmente: filtro por finca
  - Actualizar `ParcelForm.tsx`:
    - Agregar dropdown para seleccionar finca (requerido)
    - Cargar lista de fincas del productor

  **Must NOT do**:
  - NO mostrar esta vista a operarios (ellos ven Task 22)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 20-23)
  - **Blocks**: Task F3
  - **Blocked By**: Tasks 14, 16, 17

  **References**:
  - `frontend/src/features/parcels/pages/ParcelsPage.tsx` - Archivo a modificar
  - `frontend/src/shared/components/common/ParcelForm.tsx` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] ParcelForm tiene dropdown de fincas
  - [ ] Crear parcela requiere seleccionar finca
  - [ ] Lista muestra nombre de finca de cada parcela

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Crear parcela con finca
    Tool: Playwright
    Preconditions: Productor logueado con al menos una finca
    Steps:
      1. Navegar a /parcelas
      2. Click "Nueva Parcela"
      3. Verificar que existe dropdown de fincas
      4. Seleccionar finca, llenar demás campos
      5. Guardar
      6. Verificar que la parcela muestra el nombre de la finca
    Expected Result: Parcela creada asociada a finca
    Evidence: .sisyphus/evidence/task-19-parcela-finca.png
  ```

  **Commit**: NO (agrupa con Wave 4)

- [ ] 20. Modificar CropsPage (compatible con nueva jerarquía)

  **What to do**:
  - Actualizar `frontend/src/features/crops/pages/CropsPage.tsx`:
    - Si es PRODUCTOR: mostrar todos los cultivos de sus parcelas
    - Si es OPERARIO: mostrar solo cultivos de parcelas asignadas
    - Ajustar filtros para nueva jerarquía
  - El CropForm ya selecciona parcela, no necesita cambios si parcela viene filtrada

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task F3
  - **Blocked By**: Tasks 11, 16

  **References**:
  - `frontend/src/features/crops/pages/CropsPage.tsx` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] Productor ve todos sus cultivos
  - [ ] Build sin errores

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Productor ve cultivos
    Tool: Playwright
    Steps:
      1. Login como productor
      2. Navegar a /cultivos
      3. Verificar que lista de cultivos carga
    Expected Result: Cultivos visibles
    Evidence: .sisyphus/evidence/task-20-crops-productor.png
  ```

  **Commit**: NO (agrupa con Wave 4)

- [ ] 21. Implementar navegación por rol

  **What to do**:
  - Modificar `frontend/src/shared/components/layout/navConfig.ts`:
    - Agregar item para Fincas (solo PRODUCTOR)
    - Agregar item para Operarios (solo PRODUCTOR)
  - Modificar `frontend/src/shared/components/layout/SideNav.tsx` (o donde se renderiza nav):
    - Filtrar items según `authStore.user.rol`
    - PRODUCTOR ve: Dashboard, Fincas, Parcelas, Cultivos, Operarios, Actividades, Clima, Alertas, Reportes
    - OPERARIO ve: Dashboard, Mis Parcelas, Actividades, Clima, Alertas

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 22, F3
  - **Blocked By**: Tasks 16, 17, 18

  **References**:
  - `frontend/src/shared/components/layout/navConfig.ts` - Archivo a modificar
  - `frontend/src/shared/components/layout/SideNav.tsx` - Archivo a modificar
  - `frontend/src/store/authStore.ts` - Para obtener rol

  **Acceptance Criteria**:
  - [ ] Productor ve menú completo con Fincas y Operarios
  - [ ] Operario ve menú reducido sin Fincas ni Operarios

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Navegación de productor
    Tool: Playwright
    Steps:
      1. Login como productor
      2. Verificar que SideNav contiene "Fincas"
      3. Verificar que SideNav contiene "Operarios"
      4. Screenshot del menú
    Expected Result: Menú completo visible
    Evidence: .sisyphus/evidence/task-21-nav-productor.png

  Scenario: Navegación de operario
    Tool: Playwright
    Steps:
      1. Login como operario
      2. Verificar que SideNav NO contiene "Fincas"
      3. Verificar que SideNav NO contiene "Operarios"
      4. Verificar que SideNav contiene "Mis Parcelas" o "Parcelas"
    Expected Result: Menú reducido
    Evidence: .sisyphus/evidence/task-21-nav-operario.png
  ```

  **Commit**: NO (agrupa con Wave 4)

- [ ] 22. Vista de operario (parcelas asignadas)

  **What to do**:
  - Crear `frontend/src/features/operario/pages/MisParcelasPage.tsx` (o reutilizar ParcelsPage con filtro):
    - Mostrar SOLO parcelas asignadas al operario (RF70)
    - Mostrar cultivos de esas parcelas
    - Permitir registrar actividades
    - NO permitir crear/editar/eliminar parcelas ni cultivos
  - Configurar ruta `/mis-parcelas` para operarios
  - Redirigir operarios de `/parcelas` a `/mis-parcelas`

  **Must NOT do**:
  - NO mostrar opciones de crear/editar parcelas
  - NO mostrar opciones de crear/editar cultivos
  - NO mostrar fincas

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task F3
  - **Blocked By**: Tasks 11, 16, 21

  **References**:
  - `frontend/src/features/parcels/pages/ParcelsPage.tsx` - Base para adaptar
  - `AGENTS.md` RF70 - Requisito funcional

  **Acceptance Criteria**:
  - [ ] Operario ve solo parcelas asignadas
  - [ ] NO hay botones de crear/editar parcelas
  - [ ] Puede ver cultivos y registrar actividades

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Operario ve solo parcelas asignadas (RF70)
    Tool: Playwright
    Preconditions: Operario asignado a 1 parcela de 3 existentes
    Steps:
      1. Login como operario
      2. Navegar a /mis-parcelas (o /parcelas)
      3. Verificar que solo aparece 1 parcela
      4. Verificar que NO hay botón "Nueva Parcela"
    Expected Result: Solo parcela asignada, sin opciones de creación
    Evidence: .sisyphus/evidence/task-22-operario-parcelas.png

  Scenario: Operario puede registrar actividad
    Tool: Playwright
    Steps:
      1. Login como operario
      2. Ir a parcela asignada
      3. Ver cultivo
      4. Click "Registrar Actividad"
      5. Llenar formulario de riego
      6. Guardar
    Expected Result: Actividad registrada exitosamente
    Evidence: .sisyphus/evidence/task-22-operario-actividad.png
  ```

  **Commit**: NO (agrupa con Wave 4)

- [ ] 23. Registrar nuevas rutas en Servidor.ts + App.tsx

  **What to do**:
  - Backend - `backend/src/config/api/Servidor.ts`:
    - Importar FincaRoutes y OperarioRoutes
    - Registrar: `app.use('/api/fincas', fincaRoutes)`
    - Registrar: `app.use('/api/operarios', operarioRoutes)`
  - Frontend - `frontend/src/App.tsx`:
    - Agregar ruta `/fincas` → FincasPage (protegida, solo PRODUCTOR)
    - Agregar ruta `/operarios` → OperariosPage (protegida, solo PRODUCTOR)
    - Agregar ruta `/mis-parcelas` → MisParcelasPage (protegida, solo OPERARIO)
  - Verificar que todas las rutas funcionan

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task F1-F4
  - **Blocked By**: Tasks 12, 13, 17, 18, 22

  **References**:
  - `backend/src/config/api/Servidor.ts` - Archivo a modificar
  - `frontend/src/App.tsx` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] `/api/fincas` responde
  - [ ] `/api/operarios` responde
  - [ ] Rutas frontend funcionan

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Verificar endpoints backend
    Tool: Bash (curl)
    Steps:
      1. curl http://localhost:3000/api/fincas -H "Authorization: Bearer $TOKEN"
      2. curl http://localhost:3000/api/operarios -H "Authorization: Bearer $TOKEN"
      3. Verificar status 200 en ambos
    Expected Result: Ambos endpoints responden
    Evidence: .sisyphus/evidence/task-23-routes.txt

  Scenario: Verificar rutas frontend
    Tool: Playwright
    Steps:
      1. Login como productor
      2. Navegar a /fincas - verificar que carga
      3. Navegar a /operarios - verificar que carga
    Expected Result: Páginas cargan sin error
    Evidence: .sisyphus/evidence/task-23-frontend-routes.png
  ```

  **Commit**: YES (fin de Wave 4)
  - Message: `feat(integration): register routes and finalize role-based navigation`
  - Files: Servidor.ts, App.tsx, archivos de Wave 4

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` (backend). Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code. Check for AI slop: excessive comments, over-abstraction.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Test full lifecycle: Productor crea finca → crea parcela → crea operario → asigna operario → Operario login → ve parcela → registra actividad → Productor desasigna → Operario ya no ve parcela. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verify 1:1 compliance: everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(schema): add fincas and asignacion_operarios tables`
- **Wave 2**: `feat(backend): implement finca and operario services`
- **Wave 3**: `feat(api): add finca and operario endpoints, update parcela`
- **Wave 4**: `feat(frontend): add finca and operario management pages`
- **Final**: `chore: cleanup and final verification`

---

## Success Criteria

### Verification Commands
```bash
# Backend compila
cd backend && bun run build

# Frontend compila
cd frontend && bun run build

# Servidor levanta
cd backend && bun run dev &
curl http://localhost:3000/api/health
```

### Final Checklist
- [ ] Entidad Finca con CRUD funcional
- [ ] Parcela pertenece a Finca (no a Usuario directo)
- [ ] Asignación operario-parcela funcional
- [ ] Operario solo ve parcelas asignadas
- [ ] Productor gestiona operarios y asignaciones
- [ ] Navegación filtrada por rol
- [ ] Build sin errores (backend y frontend)
