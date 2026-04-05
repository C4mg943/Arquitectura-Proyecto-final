# Conexión Frontend-Backend PDIA

## TL;DR

> **Quick Summary**: Conectar completamente el frontend React con el backend Express para la plataforma PDIA. Incluye autenticación funcional, CRUD de parcelas/cultivos, y creación de endpoints faltantes (actividades, alertas, reportes).
> 
> **Deliverables**:
> - Frontend con apiClient completo y autenticación persistente
> - Todas las páginas conectadas a APIs reales (excepto clima = mock)
> - Backend con nuevos módulos: Actividades, Alertas, Reportes
> - Rutas protegidas con JWT
> 
> **Estimated Effort**: Large (3-4 días de trabajo)
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: T1 (apiClient) → T3 (Login) → T6 (Parcelas) → T10 (Backend Actividades) → T15 (Final QA)

---

## Context

### Original Request
"Analiza el backend e intenta conectarlo con el frontend y hacer que todo funcione, para todas las páginas del frontend incluyendo el login"

### Interview Summary
**Key Discussions**:
- Backend faltante: Usuario eligió CREAR endpoints para Actividades, Alertas, Reportes
- WeatherPage: Usuario eligió mantener con datos MOCK
- Tests: Usuario eligió SIN tests automatizados (velocidad)
- Offline: Usuario eligió DIFERIR para después (funcionalidad online primero)

**Research Findings**:
- Backend tiene 13 endpoints funcionando (Auth: 3, Parcelas: 5, Cultivos: 5)
- Frontend tiene 9 páginas, TODAS con datos mock hardcodeados
- `apiClient.ts` solo tiene `probarConexion()` - necesita expansión completa
- `authStore.ts` no persiste token en localStorage
- `ParcelForm.tsx` y `CropForm.tsx` están vacíos (0 líneas)
- `RegisterPage` falta campo `identificacion` requerido por backend
- `PrivateRoute` está comentado en App.tsx

### Metis Review
**Identified Gaps** (addressed):
- Error handling strategy: Aplicado default → Toast + mensajes en forms
- Loading states: Aplicado default → Spinners + skeletons
- Offline-first: Diferido por decisión del usuario
- API contracts: Cada módulo backend nuevo define contrato primero
- Data seeding: NO incluido (no esencial)

---

## Work Objectives

### Core Objective
Transformar el frontend de datos mock a conexión real con backend, implementando autenticación completa y creando los endpoints backend faltantes para actividades, alertas y reportes.

### Concrete Deliverables
- `frontend/src/shared/services/apiClient.ts` - Cliente HTTP completo con interceptors
- `frontend/src/store/authStore.ts` - Estado con persistencia localStorage
- `frontend/src/shared/components/common/PrivateRoute.tsx` - Protección de rutas
- Todas las páginas conectadas: Login, Register, Dashboard, Parcels, Crops, Activities, Alerts, Reports
- `backend/src/app/finca/` - Nuevos módulos: actividad, alerta, reporte

### Definition of Done
- [ ] Usuario puede registrarse con todos los campos (nombre, identificacion, email, password)
- [ ] Usuario puede iniciar sesión y el token persiste en refresh
- [ ] Rutas protegidas redirigen a login si no hay token
- [ ] CRUD completo de parcelas funcional desde UI
- [ ] CRUD completo de cultivos funcional desde UI
- [ ] Actividades se crean y listan desde backend real
- [ ] Alertas se generan y consultan desde backend
- [ ] Reportes se generan (CSV) desde backend

### Must Have
- Autenticación JWT con token persistido en localStorage
- Interceptor de auth que adjunta token a todas las requests
- Manejo de errores 401 que redirige a login
- Validación de formularios antes de enviar
- Loading states en todas las operaciones async
- Mensajes de error claros al usuario

### Must NOT Have (Guardrails)
- ❌ NestJS - Este es Entregable 2, solo Express puro
- ❌ Funcionalidad offline/IndexedDB - Diferido para fase posterior
- ❌ Tests automatizados - Usuario eligió velocidad
- ❌ Integración real con Open-Meteo - WeatherPage queda mock
- ❌ Generación PDF - Solo CSV en esta fase
- ❌ Sistema de notificaciones push
- ❌ Cambios al schema de base de datos existente (solo agregar tablas nuevas)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (jest en backend)
- **Automated tests**: NO (user choice for speed)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright - Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) - Send requests, assert status + response fields
- **Forms**: Fill with specific test data, verify validation, check submission

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - can all start immediately):
├── Task 1: Expand apiClient with HTTP methods + auth interceptor [quick]
├── Task 2: Fix authStore with localStorage persistence [quick]
└── Task 3: Implement PrivateRoute component [quick]

Wave 2 (Auth Connection - depends on Wave 1):
├── Task 4: Connect LoginPage to backend [quick]
├── Task 5: Connect RegisterPage (add identificacion field) [quick]
└── Task 6: Connect DashboardPage with real user data [quick]

Wave 3 (Existing Endpoints - depends on auth working):
├── Task 7: Connect ParcelsPage + implement ParcelForm [visual-engineering]
├── Task 8: Connect CropsPage + implement CropForm [visual-engineering]
└── Task 9: Fix App.tsx routes with PrivateRoute protection [quick]

Wave 4 (New Backend Modules - can start after Wave 1):
├── Task 10: Create Actividades backend module [unspecified-high]
├── Task 11: Create Alertas backend module [unspecified-high]
└── Task 12: Create Reportes backend module [unspecified-high]

Wave 5 (Final Connections - depends on Wave 3 & 4):
├── Task 13: Connect ActivitiesPage to new backend [quick]
├── Task 14: Connect AlertsPage to new backend [quick]
└── Task 15: Connect ReportsPage to new backend [quick]

Wave FINAL (After ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: T1 → T4 → T7 → T10 → T13 → F1-F4 → user okay
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 3 (Waves 1, 4)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 4, 5, 6, 7, 8, 10, 11, 12 | 1 |
| 2 | - | 4, 5 | 1 |
| 3 | - | 9 | 1 |
| 4 | 1, 2 | 6, 7, 8 | 2 |
| 5 | 1, 2 | - | 2 |
| 6 | 4 | - | 2 |
| 7 | 4 | 13 | 3 |
| 8 | 4 | - | 3 |
| 9 | 3 | - | 3 |
| 10 | 1 | 13 | 4 |
| 11 | 1 | 14 | 4 |
| 12 | 1 | 15 | 4 |
| 13 | 7, 10 | - | 5 |
| 14 | 11 | - | 5 |
| 15 | 12 | - | 5 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks → T1-T3 all `quick`
- **Wave 2**: 3 tasks → T4-T6 all `quick`
- **Wave 3**: 3 tasks → T7-T8 `visual-engineering`, T9 `quick`
- **Wave 4**: 3 tasks → T10-T12 all `unspecified-high`
- **Wave 5**: 3 tasks → T13-T15 all `quick`
- **FINAL**: 4 tasks → F1 `oracle`, F2-F3 `unspecified-high`, F4 `deep`

---

## TODOs

### Wave 1: Foundation (Start Immediately)

- [ ] 1. Expand apiClient with HTTP methods and auth interceptor

  **What to do**:
  - Refactor `frontend/src/shared/services/apiClient.ts` to be a full HTTP client
  - Add methods: `get<T>()`, `post<T>()`, `put<T>()`, `delete<T>()` with proper generics
  - Implement request interceptor that adds `Authorization: Bearer {token}` header from authStore
  - Implement response interceptor that handles 401 errors (clear token, redirect to /login)
  - Add base URL from environment variable `VITE_API_URL`
  - Export typed methods for each endpoint group (auth, parcelas, cultivos)

  **Must NOT do**:
  - Don't use axios - keep it simple with native fetch
  - Don't add retry logic (not needed yet)
  - Don't add caching

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file modification with clear patterns to follow
  - **Skills**: []
    - No special skills needed - standard TypeScript/fetch work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 8, 10, 11, 12
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `frontend/src/shared/services/apiClient.ts:1-15` - Current implementation (only has probarConexion)
  - `frontend/src/store/authStore.ts:1-20` - Where to get token from

  **API/Type References**:
  - `backend/src/app/finca/route/AuthRoutes.ts` - Auth endpoint paths
  - `backend/src/app/finca/route/ParcelaRoutes.ts` - Parcela endpoint paths
  - `backend/src/app/finca/route/CultivoRoutes.ts` - Cultivo endpoint paths

  **External References**:
  - Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

  **WHY Each Reference Matters**:
  - `apiClient.ts` shows current structure to extend
  - `authStore.ts` shows how to access token for interceptor
  - Route files show exact endpoint paths to implement

  **Acceptance Criteria**:
  - [ ] File exports `apiClient` object with get, post, put, delete methods
  - [ ] Each method accepts generic type for response
  - [ ] Authorization header is automatically added when token exists
  - [ ] 401 responses trigger logout and redirect

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: API client makes authenticated request
    Tool: Bash (curl + node)
    Preconditions: Backend running on port 3123, valid JWT token available
    Steps:
      1. Create test script that imports apiClient
      2. Set mock token in authStore
      3. Call apiClient.get('/api/auth/me')
      4. Verify request includes Authorization header
    Expected Result: Request succeeds with user data
    Failure Indicators: 401 error, missing header, network error
    Evidence: .sisyphus/evidence/task-1-auth-request.txt

  Scenario: API client handles 401 by clearing auth
    Tool: Bash (node)
    Preconditions: apiClient configured, invalid/expired token set
    Steps:
      1. Set expired token in authStore
      2. Call apiClient.get('/api/auth/me')
      3. Check authStore.token after response
    Expected Result: Token is cleared, user would be redirected to login
    Failure Indicators: Token persists after 401, no error handling
    Evidence: .sisyphus/evidence/task-1-401-handling.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): add apiClient methods and auth persistence`
  - Files: `frontend/src/shared/services/apiClient.ts`

- [ ] 2. Fix authStore with localStorage persistence

  **What to do**:
  - Modify `frontend/src/store/authStore.ts` to persist token in localStorage
  - On store initialization, check localStorage for existing token
  - On `setToken()`, save to localStorage
  - On `logout()`, clear from localStorage
  - Add `isAuthenticated` computed getter
  - Add user data storage (id, nombre, email, rol)

  **Must NOT do**:
  - Don't store password
  - Don't use sessionStorage (user wants persistence across tabs)
  - Don't add token refresh logic yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small file, clear Zustand patterns already in place
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/store/authStore.ts:1-25` - Current Zustand store structure

  **API/Type References**:
  - `frontend/src/shared/models/User.ts` - User type definition
  - `backend/src/app/finca/controller/AuthController.ts:login` - Response shape from login

  **External References**:
  - Zustand persist middleware: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

  **WHY Each Reference Matters**:
  - Current store shows Zustand pattern to extend
  - User.ts has the interface for user data
  - AuthController shows what data login returns

  **Acceptance Criteria**:
  - [ ] Token persists in localStorage under key `auth-token`
  - [ ] User data persists in localStorage under key `auth-user`
  - [ ] Page refresh maintains logged-in state
  - [ ] Logout clears both localStorage keys

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Token persists across page refresh
    Tool: Playwright
    Preconditions: App running on localhost:5173
    Steps:
      1. Navigate to /login
      2. Login with test@test.com / password123
      3. Verify redirect to dashboard
      4. Refresh page (F5)
      5. Check user is still logged in (dashboard visible, not login page)
    Expected Result: User remains authenticated after refresh
    Failure Indicators: Redirected to login, token lost
    Evidence: .sisyphus/evidence/task-2-persistence.png

  Scenario: Logout clears stored data
    Tool: Playwright
    Preconditions: User logged in
    Steps:
      1. Click logout button
      2. Open browser DevTools > Application > localStorage
      3. Verify auth-token and auth-user are removed
    Expected Result: localStorage is cleared of auth data
    Failure Indicators: Data persists after logout
    Evidence: .sisyphus/evidence/task-2-logout-clear.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): add apiClient methods and auth persistence`
  - Files: `frontend/src/store/authStore.ts`

- [ ] 3. Implement PrivateRoute component

  **What to do**:
  - Create `frontend/src/shared/components/common/PrivateRoute.tsx`
  - Component checks if user is authenticated via authStore
  - If authenticated, render children (Outlet)
  - If not authenticated, redirect to /login
  - Add loading state while checking auth

  **Must NOT do**:
  - Don't add role-based access control yet
  - Don't add token validation (just check existence)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple React component with clear pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `frontend/src/App.tsx:1-50` - Current routing structure (has commented PrivateRoute)
  - `frontend/src/store/authStore.ts` - Auth state to check

  **External References**:
  - React Router protected routes: https://reactrouter.com/en/main/start/tutorial#protecting-routes

  **WHY Each Reference Matters**:
  - App.tsx shows where PrivateRoute will be used
  - authStore shows how to check authentication

  **Acceptance Criteria**:
  - [ ] Component exists at correct path
  - [ ] Renders children when authenticated
  - [ ] Redirects to /login when not authenticated
  - [ ] Shows loading spinner while checking

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Unauthenticated user redirected to login
    Tool: Playwright
    Preconditions: App running, no token in localStorage
    Steps:
      1. Clear localStorage
      2. Navigate directly to /parcelas (protected route)
      3. Check URL
    Expected Result: URL is /login, login page visible
    Failure Indicators: Parcelas page loads, no redirect
    Evidence: .sisyphus/evidence/task-3-redirect.png

  Scenario: Authenticated user can access protected route
    Tool: Playwright
    Preconditions: Valid token in localStorage
    Steps:
      1. Set valid token in localStorage
      2. Navigate to /parcelas
      3. Check URL and page content
    Expected Result: URL is /parcelas, parcels page content visible
    Failure Indicators: Redirected to login despite valid token
    Evidence: .sisyphus/evidence/task-3-access.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(frontend): add apiClient methods and auth persistence`
  - Files: `frontend/src/shared/components/common/PrivateRoute.tsx`

### Wave 2: Auth Connection (After Wave 1)

- [ ] 4. Connect LoginPage to backend

  **What to do**:
  - Modify `frontend/src/features/auth/pages/LoginPage.tsx`
  - Replace mock login logic with real API call to `/api/auth/login`
  - On success: store token and user in authStore, redirect to /
  - On error: show error message (toast or inline)
  - Add loading state while request is in progress
  - Disable submit button during loading

  **Must NOT do**:
  - Don't add "remember me" functionality
  - Don't add social login buttons
  - Don't implement password visibility toggle (if not already there)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward form submission to API
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `frontend/src/features/auth/pages/LoginPage.tsx` - Current UI to modify
  - `frontend/src/shared/services/apiClient.ts` - API client to use (after Task 1)

  **API/Type References**:
  - `backend/src/app/finca/controller/AuthController.ts:login` - Login endpoint logic
  - `backend/src/app/finca/dto/LoginDTO.ts` - Request body shape: { email, password }

  **WHY Each Reference Matters**:
  - LoginPage.tsx is the file to modify
  - AuthController shows expected request/response format

  **Acceptance Criteria**:
  - [ ] Form submits to `/api/auth/login`
  - [ ] Success stores token and redirects to /
  - [ ] Error displays message to user
  - [ ] Button shows loading state during request

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Successful login flow
    Tool: Playwright
    Preconditions: Backend running, user exists (test@test.com / password123)
    Steps:
      1. Navigate to /login
      2. Fill email input with "test@test.com"
      3. Fill password input with "password123"
      4. Click "Iniciar Sesión" button
      5. Wait for redirect
    Expected Result: URL changes to /, dashboard content visible, user name in header
    Failure Indicators: Still on /login, error message, network error
    Evidence: .sisyphus/evidence/task-4-login-success.png

  Scenario: Failed login with wrong password
    Tool: Playwright
    Preconditions: Backend running
    Steps:
      1. Navigate to /login
      2. Fill email with "test@test.com"
      3. Fill password with "wrongpassword"
      4. Click "Iniciar Sesión"
      5. Check for error message
    Expected Result: Error message appears (e.g., "Credenciales inválidas"), stays on /login
    Failure Indicators: Redirects despite wrong password, no error shown
    Evidence: .sisyphus/evidence/task-4-login-fail.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(auth): connect login and register pages to backend`
  - Files: `frontend/src/features/auth/pages/LoginPage.tsx`

- [ ] 5. Connect RegisterPage and add identificacion field

  **What to do**:
  - Modify `frontend/src/features/auth/pages/RegisterPage.tsx`
  - Add `identificacion` field (required by backend RF01)
  - Connect form to `/api/auth/register` endpoint
  - On success: auto-login user or redirect to login with success message
  - On error: show validation errors (email exists, etc.)
  - Add loading state

  **Must NOT do**:
  - Don't add terms and conditions checkbox
  - Don't add email verification
  - Don't add password strength meter

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Form modification with additional field
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `frontend/src/features/auth/pages/RegisterPage.tsx` - Current form (missing identificacion)
  - `frontend/src/features/auth/pages/LoginPage.tsx` - Similar form pattern

  **API/Type References**:
  - `backend/src/app/finca/controller/AuthController.ts:registro` - Register endpoint
  - `backend/src/app/finca/dto/RegistroDTO.ts` - Required fields: nombre, identificacion, email, password

  **WHY Each Reference Matters**:
  - RegisterPage needs the identificacion field added
  - RegistroDTO shows exact field names required by backend

  **Acceptance Criteria**:
  - [ ] Form has 4 fields: nombre, identificacion, email, password
  - [ ] Form submits to `/api/auth/register`
  - [ ] Success redirects to login with message
  - [ ] Duplicate email shows error message

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Successful registration
    Tool: Playwright
    Preconditions: Backend running, email not already registered
    Steps:
      1. Navigate to /register
      2. Fill nombre: "Test User"
      3. Fill identificacion: "12345678"
      4. Fill email: "newuser@test.com"
      5. Fill password: "password123"
      6. Click "Registrarse" button
    Expected Result: Redirect to /login, success message visible
    Failure Indicators: Error message, stays on register
    Evidence: .sisyphus/evidence/task-5-register-success.png

  Scenario: Registration with existing email fails
    Tool: Playwright
    Preconditions: User test@test.com already exists
    Steps:
      1. Navigate to /register
      2. Fill form with existing email "test@test.com"
      3. Click register
    Expected Result: Error message "El correo ya está registrado" or similar
    Failure Indicators: Registration succeeds, no error
    Evidence: .sisyphus/evidence/task-5-register-duplicate.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(auth): connect login and register pages to backend`
  - Files: `frontend/src/features/auth/pages/RegisterPage.tsx`

- [ ] 6. Connect DashboardPage with real user data

  **What to do**:
  - Modify `frontend/src/features/dashboard/pages/DashboardPage.tsx`
  - Fetch user's parcelas count from `/api/parcelas`
  - Fetch user's cultivos count from `/api/cultivos`
  - Display real counts instead of mock data
  - Show user name from authStore in welcome message
  - Add loading skeletons while fetching

  **Must NOT do**:
  - Don't add charts or graphs yet
  - Don't fetch weather data (stays mock)
  - Don't add recent activities (backend doesn't exist yet)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Data fetching and display, straightforward
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: None
  - **Blocked By**: Task 4 (needs auth working)

  **References**:

  **Pattern References**:
  - `frontend/src/features/dashboard/pages/DashboardPage.tsx` - Current mock data to replace
  - `frontend/src/store/authStore.ts` - User data for welcome message

  **API/Type References**:
  - `backend/src/app/finca/controller/ParcelaController.ts:obtenerPorUsuario` - Returns user's parcelas
  - `backend/src/app/finca/controller/CultivoController.ts:obtenerPorUsuario` - Returns user's cultivos

  **WHY Each Reference Matters**:
  - DashboardPage needs to fetch real data
  - Controllers show response format for counts

  **Acceptance Criteria**:
  - [ ] Shows real parcelas count for logged user
  - [ ] Shows real cultivos count for logged user
  - [ ] Welcome message includes user's name
  - [ ] Shows loading state while fetching

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Dashboard shows real data
    Tool: Playwright
    Preconditions: User logged in with 2 parcelas and 3 cultivos
    Steps:
      1. Login as test user
      2. Navigate to / (dashboard)
      3. Wait for data to load
      4. Check parcelas count widget
      5. Check cultivos count widget
    Expected Result: Shows "2 Parcelas" and "3 Cultivos" (or actual counts)
    Failure Indicators: Shows mock data (e.g., always "5"), shows 0, error
    Evidence: .sisyphus/evidence/task-6-dashboard-data.png

  Scenario: Dashboard shows user name
    Tool: Playwright
    Preconditions: Logged in as "Juan Pérez"
    Steps:
      1. Check dashboard header/welcome area
    Expected Result: Text contains "Juan" or "Juan Pérez"
    Failure Indicators: Generic greeting, "undefined", mock name
    Evidence: .sisyphus/evidence/task-6-dashboard-name.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(auth): connect login and register pages to backend`
  - Files: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

### Wave 3: Existing Endpoints (After Wave 2)

- [ ] 7. Connect ParcelsPage and implement ParcelForm

  **What to do**:
  - Modify `frontend/src/features/parcels/pages/ParcelsPage.tsx` to fetch from `/api/parcelas`
  - Implement `frontend/src/shared/components/common/ParcelForm.tsx` (currently empty)
  - Form fields: nombre, municipio, hectareas, latitud, longitud
  - Support CREATE and EDIT modes in form
  - Add delete confirmation dialog
  - Implement full CRUD: list, create, update, delete
  - Add loading states and error handling

  **Must NOT do**:
  - Don't add map picker for coordinates (manual input only)
  - Don't add image upload for parcela
  - Don't add batch operations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Form UI implementation with multiple states
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Task 13
  - **Blocked By**: Task 4 (needs auth working)

  **References**:

  **Pattern References**:
  - `frontend/src/features/parcels/pages/ParcelsPage.tsx` - Page to modify
  - `frontend/src/shared/components/common/ParcelForm.tsx` - Empty file to implement
  - `frontend/src/features/crops/pages/CropsPage.tsx` - Similar page pattern

  **API/Type References**:
  - `frontend/src/shared/models/Parcel.ts` - Parcel type definition
  - `backend/src/app/finca/dto/ParcelaDTO.ts` - Backend DTO for validation
  - `backend/src/app/finca/controller/ParcelaController.ts` - All CRUD operations

  **WHY Each Reference Matters**:
  - ParcelsPage is the target, CropsPage shows similar patterns
  - ParcelForm is empty and needs full implementation
  - Parcel.ts and ParcelaDTO show field structure

  **Acceptance Criteria**:
  - [ ] Page loads parcelas from API on mount
  - [ ] "Nueva Parcela" button opens form modal
  - [ ] Form validates required fields before submit
  - [ ] Create saves to API and updates list
  - [ ] Edit button opens form with existing data
  - [ ] Delete shows confirmation and removes from list

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Create new parcela
    Tool: Playwright
    Preconditions: Logged in user
    Steps:
      1. Navigate to /parcelas
      2. Click "Nueva Parcela" button
      3. Fill nombre: "Finca El Roble"
      4. Fill municipio: "Santa Marta"
      5. Fill hectareas: "15"
      6. Fill latitud: "11.2408"
      7. Fill longitud: "-74.1990"
      8. Click "Guardar"
    Expected Result: Modal closes, new parcela appears in list
    Failure Indicators: Error message, modal stays open, list unchanged
    Evidence: .sisyphus/evidence/task-7-create-parcela.png

  Scenario: Delete parcela with confirmation
    Tool: Playwright
    Preconditions: At least one parcela exists
    Steps:
      1. Navigate to /parcelas
      2. Click delete button on first parcela
      3. Confirmation dialog appears
      4. Click "Confirmar" or "Eliminar"
    Expected Result: Parcela removed from list
    Failure Indicators: No confirmation, parcela still in list
    Evidence: .sisyphus/evidence/task-7-delete-parcela.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(frontend): connect parcels and crops with full CRUD`
  - Files: `frontend/src/features/parcels/pages/ParcelsPage.tsx`, `frontend/src/shared/components/common/ParcelForm.tsx`

- [ ] 8. Connect CropsPage and implement CropForm

  **What to do**:
  - Modify `frontend/src/features/crops/pages/CropsPage.tsx` to fetch from `/api/cultivos`
  - Implement `frontend/src/shared/components/common/CropForm.tsx` (currently empty)
  - Form fields: tipoCultivo, fechaSiembra, estado, observaciones, parcelaId (dropdown)
  - Estado dropdown: EN_CRECIMIENTO, COSECHADO, AFECTADO
  - ParcelaId dropdown populated from `/api/parcelas`
  - Support CREATE and EDIT modes
  - Implement full CRUD: list, create, update, delete

  **Must NOT do**:
  - Don't add crop images
  - Don't add growth tracking timeline
  - Don't add harvest predictions

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex form with dropdowns and relationships
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: None
  - **Blocked By**: Task 4 (needs auth), Task 7 (needs parcelas for dropdown)

  **References**:

  **Pattern References**:
  - `frontend/src/features/crops/pages/CropsPage.tsx` - Page to modify
  - `frontend/src/shared/components/common/CropForm.tsx` - Empty file to implement
  - `frontend/src/shared/components/common/ParcelForm.tsx` - Similar form pattern (after Task 7)

  **API/Type References**:
  - `frontend/src/shared/models/Crop.ts` - Crop type (may need parcelaId added)
  - `backend/src/app/finca/dto/CultivoDTO.ts` - Backend DTO
  - `backend/src/app/finca/controller/CultivoController.ts` - CRUD operations

  **WHY Each Reference Matters**:
  - CropsPage is the target file
  - CropForm needs implementation
  - Need to ensure Crop type matches backend DTO

  **Acceptance Criteria**:
  - [ ] Page loads cultivos from API on mount
  - [ ] "Nuevo Cultivo" opens form with parcela dropdown
  - [ ] Estado field is a dropdown with 3 options
  - [ ] FechaSiembra is a date picker
  - [ ] Create/Edit/Delete all work with API

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Create cultivo with parcela selection
    Tool: Playwright
    Preconditions: Logged in, at least 1 parcela exists
    Steps:
      1. Navigate to /cultivos
      2. Click "Nuevo Cultivo"
      3. Select parcela from dropdown
      4. Fill tipoCultivo: "Tomate"
      5. Select fechaSiembra: today
      6. Select estado: "EN_CRECIMIENTO"
      7. Fill observaciones: "Siembra inicial"
      8. Click "Guardar"
    Expected Result: Modal closes, new cultivo in list with parcela name
    Failure Indicators: Parcela dropdown empty, save fails
    Evidence: .sisyphus/evidence/task-8-create-cultivo.png

  Scenario: Edit cultivo estado
    Tool: Playwright
    Preconditions: Cultivo exists with estado EN_CRECIMIENTO
    Steps:
      1. Navigate to /cultivos
      2. Click edit on existing cultivo
      3. Change estado to "COSECHADO"
      4. Click "Guardar"
    Expected Result: List shows updated estado
    Failure Indicators: Estado unchanged, error
    Evidence: .sisyphus/evidence/task-8-edit-estado.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(frontend): connect parcels and crops with full CRUD`
  - Files: `frontend/src/features/crops/pages/CropsPage.tsx`, `frontend/src/shared/components/common/CropForm.tsx`

- [ ] 9. Fix App.tsx routes with PrivateRoute protection

  **What to do**:
  - Modify `frontend/src/App.tsx` to use PrivateRoute component
  - Wrap all protected routes (/, /parcelas, /cultivos, /actividades, /clima, /alertas, /reportes)
  - Keep /login and /register as public routes
  - Ensure proper nesting with React Router Outlet

  **Must NOT do**:
  - Don't add role-based route restrictions
  - Don't add nested layouts beyond current structure
  - Don't change route paths

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple routing configuration change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: None
  - **Blocked By**: Task 3 (needs PrivateRoute component)

  **References**:

  **Pattern References**:
  - `frontend/src/App.tsx` - Current routing (has commented code to uncomment/fix)
  - `frontend/src/shared/components/common/PrivateRoute.tsx` - Component from Task 3

  **External References**:
  - React Router layout routes: https://reactrouter.com/en/main/route/route#layout-routes

  **WHY Each Reference Matters**:
  - App.tsx has the route definitions to modify
  - PrivateRoute must wrap protected routes correctly

  **Acceptance Criteria**:
  - [ ] /login and /register accessible without auth
  - [ ] All other routes redirect to /login if not authenticated
  - [ ] After login, user can access all protected routes
  - [ ] Logout redirects to /login

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Protected routes redirect when not logged in
    Tool: Playwright
    Preconditions: No token in localStorage
    Steps:
      1. Clear localStorage
      2. Try to navigate to /parcelas
      3. Check resulting URL
      4. Try /cultivos, /actividades, /clima
    Expected Result: All redirect to /login
    Failure Indicators: Any protected page loads
    Evidence: .sisyphus/evidence/task-9-protection.png

  Scenario: All routes work after login
    Tool: Playwright
    Preconditions: Fresh session
    Steps:
      1. Login successfully
      2. Navigate to each route: /, /parcelas, /cultivos, /actividades, /clima, /alertas, /reportes
      3. Verify each page loads
    Expected Result: All pages accessible, correct content shown
    Failure Indicators: Any route fails or redirects to login
    Evidence: .sisyphus/evidence/task-9-all-routes.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(frontend): connect parcels and crops with full CRUD`
  - Files: `frontend/src/App.tsx`

### Wave 4: New Backend Modules (Can start after Wave 1)

- [ ] 10. Create Actividades backend module

  **What to do**:
  - Create new module at `backend/src/app/finca/actividad/`
  - Files: `ActividadController.ts`, `ActividadService.ts`, `ActividadRepository.ts`, `ActividadRoutes.ts`
  - Create DTO: `ActividadDTO.ts` with fields: tipo, fecha, descripcion, datos, cultivoId
  - Tipos de actividad: RIEGO, FERTILIZACION, PLAGA, OBSERVACION
  - Endpoints:
    - GET `/api/actividades` - List all for user's cultivos
    - GET `/api/actividades/:id` - Get single
    - GET `/api/actividades/cultivo/:cultivoId` - List by cultivo
    - POST `/api/actividades` - Create new
    - PUT `/api/actividades/:id` - Update
    - DELETE `/api/actividades/:id` - Delete
  - Use existing patterns from ParcelaController/CultivoController
  - Use ListaP where appropriate (academic requirement)
  - All routes protected with AuthMiddleware

  **Must NOT do**:
  - Don't add offline sync endpoint (deferred)
  - Don't add batch create
  - Don't add activity statistics

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full module creation following existing patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Task 1 (needs apiClient for testing)

  **References**:

  **Pattern References**:
  - `backend/src/app/finca/cultivo/` - Exact pattern to follow (Controller, Service, Repository, Routes)
  - `backend/src/app/finca/parcela/` - Alternative reference
  - `backend/src/middleware/AuthMiddleware.ts` - For route protection
  - `backend/src/utilidades/ListaP.ts` - Custom data structure (required)

  **API/Type References**:
  - `backend/src/app/finca/model/Cultivo.ts` - Parent entity for actividades
  - `backend/src/app/finca/dto/CultivoDTO.ts` - DTO pattern to follow

  **Database Reference**:
  - Create table `actividades` with: id, tipo (enum), fecha, descripcion, datos (jsonb), cultivo_id, created_by, created_at

  **WHY Each Reference Matters**:
  - cultivo/ module is the exact pattern to replicate
  - ListaP must be used per academic requirements
  - AuthMiddleware protects routes by user

  **Acceptance Criteria**:
  - [ ] All 6 endpoints implemented and responding
  - [ ] POST creates actividad linked to cultivo
  - [ ] GET by cultivoId returns only that cultivo's activities
  - [ ] Only owner of cultivo can CRUD its activities
  - [ ] TypeScript compiles without errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Create actividad de riego
    Tool: Bash (curl)
    Preconditions: Backend running, valid JWT token, cultivo exists with id=1
    Steps:
      1. curl -X POST http://localhost:3123/api/actividades \
           -H "Authorization: Bearer $TOKEN" \
           -H "Content-Type: application/json" \
           -d '{"tipo":"RIEGO","fecha":"2024-01-15","descripcion":"Riego matutino","datos":{"cantidadAgua":"50L"},"cultivoId":1}'
    Expected Result: 201 Created, response contains id and all fields
    Failure Indicators: 400/401/500 error, missing fields in response
    Evidence: .sisyphus/evidence/task-10-create-actividad.txt

  Scenario: Get actividades by cultivo
    Tool: Bash (curl)
    Preconditions: Actividades exist for cultivo id=1
    Steps:
      1. curl http://localhost:3123/api/actividades/cultivo/1 \
           -H "Authorization: Bearer $TOKEN"
    Expected Result: 200 OK, array of actividades for that cultivo only
    Failure Indicators: Empty array when data exists, wrong cultivo's data
    Evidence: .sisyphus/evidence/task-10-list-by-cultivo.txt
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(backend): add actividades, alertas, reportes modules`
  - Files: `backend/src/app/finca/actividad/*`

- [ ] 11. Create Alertas backend module

  **What to do**:
  - Create new module at `backend/src/app/finca/alerta/`
  - Files: `AlertaController.ts`, `AlertaService.ts`, `AlertaRepository.ts`, `AlertaRoutes.ts`
  - Create DTO: `AlertaDTO.ts` with fields: tipo, valorDetectado, fecha, cultivoId
  - Tipos de alerta: LLUVIA, TEMPERATURA_ALTA, TEMPERATURA_BAJA, VIENTO
  - Endpoints:
    - GET `/api/alertas` - List all for user
    - GET `/api/alertas/:id` - Get single
    - GET `/api/alertas/cultivo/:cultivoId` - List by cultivo
    - POST `/api/alertas` - Create (for manual testing, real ones would be auto-generated)
    - DELETE `/api/alertas/:id` - Delete/dismiss
  - Note: Real alert generation would be triggered by weather service (not in this scope)

  **Must NOT do**:
  - Don't implement automatic alert generation (would need scheduler)
  - Don't add push notifications
  - Don't add alert thresholds configuration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full module creation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 12)
  - **Blocks**: Task 14
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `backend/src/app/finca/cultivo/` - Pattern to follow
  - `backend/src/app/finca/actividad/` - Similar sibling module (after Task 10)
  - `backend/src/utilidades/ListaP.ts` - Required data structure

  **API/Type References**:
  - `backend/src/app/finca/model/Cultivo.ts` - Parent entity
  - AGENTS.md section 9 - Alert thresholds (for reference, not implementation)

  **Database Reference**:
  - Create table `alertas` with: id, tipo (enum), valor_detectado, fecha, cultivo_id, leida (boolean), created_at

  **WHY Each Reference Matters**:
  - Follow cultivo module pattern exactly
  - Alertas are tied to cultivos (parcela → cultivo → alerta)

  **Acceptance Criteria**:
  - [ ] All 5 endpoints implemented
  - [ ] Alertas linked to cultivos correctly
  - [ ] Can filter by cultivo
  - [ ] TypeScript compiles without errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Create alerta de lluvia
    Tool: Bash (curl)
    Preconditions: Backend running, cultivo id=1 exists
    Steps:
      1. curl -X POST http://localhost:3123/api/alertas \
           -H "Authorization: Bearer $TOKEN" \
           -H "Content-Type: application/json" \
           -d '{"tipo":"LLUVIA","valorDetectado":85,"fecha":"2024-01-15","cultivoId":1}'
    Expected Result: 201 Created with alerta data
    Failure Indicators: Error status, validation failure
    Evidence: .sisyphus/evidence/task-11-create-alerta.txt

  Scenario: List user's alertas
    Tool: Bash (curl)
    Preconditions: User has alertas
    Steps:
      1. curl http://localhost:3123/api/alertas \
           -H "Authorization: Bearer $TOKEN"
    Expected Result: 200 OK, array of user's alertas only
    Failure Indicators: Other users' alertas visible
    Evidence: .sisyphus/evidence/task-11-list-alertas.txt
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(backend): add actividades, alertas, reportes modules`
  - Files: `backend/src/app/finca/alerta/*`

- [ ] 12. Create Reportes backend module

  **What to do**:
  - Create new module at `backend/src/app/finca/reporte/`
  - Files: `ReporteController.ts`, `ReporteService.ts`, `ReporteRoutes.ts`
  - No Repository needed (reports are generated, not stored)
  - Endpoints:
    - GET `/api/reportes/actividades/:cultivoId` - Activities report for cultivo
    - GET `/api/reportes/actividades/:cultivoId/csv` - Same but as CSV download
    - GET `/api/reportes/riegos/:cultivoId` - Riegos summary
    - GET `/api/reportes/fertilizaciones/:cultivoId` - Fertilizaciones summary
  - CSV generation using simple string formatting (no heavy libraries)
  - Reports aggregate data from actividades table

  **Must NOT do**:
  - Don't add PDF generation (deferred)
  - Don't add scheduled reports
  - Don't add email delivery

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Report generation logic, data aggregation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 10, 11)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1, Task 10 (needs actividades data)

  **References**:

  **Pattern References**:
  - `backend/src/app/finca/actividad/` - Data source for reports
  - `backend/src/app/finca/cultivo/CultivoController.ts` - Controller pattern

  **API/Type References**:
  - `backend/src/app/finca/model/Actividad.ts` - Data to aggregate (after Task 10)

  **External References**:
  - CSV format: RFC 4180 (simple comma-separated with headers)

  **WHY Each Reference Matters**:
  - Reports aggregate actividades data
  - Follow controller patterns for consistency

  **Acceptance Criteria**:
  - [ ] GET /api/reportes/actividades/:cultivoId returns JSON summary
  - [ ] GET .../csv returns downloadable CSV file
  - [ ] CSV has proper headers and escaping
  - [ ] Only owner can generate reports for their cultivos

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Generate actividades report JSON
    Tool: Bash (curl)
    Preconditions: Cultivo id=1 has actividades
    Steps:
      1. curl http://localhost:3123/api/reportes/actividades/1 \
           -H "Authorization: Bearer $TOKEN"
    Expected Result: 200 OK, JSON with aggregated data (counts by tipo, date range, etc.)
    Failure Indicators: Empty response, error
    Evidence: .sisyphus/evidence/task-12-report-json.txt

  Scenario: Download CSV report
    Tool: Bash (curl)
    Preconditions: Cultivo id=1 has actividades
    Steps:
      1. curl http://localhost:3123/api/reportes/actividades/1/csv \
           -H "Authorization: Bearer $TOKEN" \
           -o report.csv
      2. Check Content-Type header is text/csv
      3. Verify file has headers and data rows
    Expected Result: CSV file downloaded with proper format
    Failure Indicators: Wrong content type, malformed CSV
    Evidence: .sisyphus/evidence/task-12-report.csv
  ```

  **Commit**: YES (groups with Wave 4)
  - Message: `feat(backend): add actividades, alertas, reportes modules`
  - Files: `backend/src/app/finca/reporte/*`

### Wave 5: Final Connections (After Waves 3 & 4)

- [ ] 13. Connect ActivitiesPage to new backend

  **What to do**:
  - Modify `frontend/src/features/activities/pages/ActivitiesPage.tsx`
  - Fetch activities from `/api/actividades`
  - Implement activity creation form (tipo, fecha, descripcion, datos, cultivoId)
  - Tipo dropdown: RIEGO, FERTILIZACION, PLAGA, OBSERVACION
  - CultivoId dropdown populated from `/api/cultivos`
  - Show activities grouped by cultivo or as flat list
  - Add filter by tipo

  **Must NOT do**:
  - Don't implement offline mode (deferred)
  - Don't add batch operations
  - Don't add calendar view

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Similar to other connected pages
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 14, 15)
  - **Blocks**: None
  - **Blocked By**: Task 7 (needs parcelas pattern), Task 10 (needs backend)

  **References**:

  **Pattern References**:
  - `frontend/src/features/activities/pages/ActivitiesPage.tsx` - Current mock page
  - `frontend/src/features/crops/pages/CropsPage.tsx` - Connected page pattern (after Task 8)
  - `frontend/src/shared/components/common/CropForm.tsx` - Form with dropdown pattern

  **API/Type References**:
  - `frontend/src/shared/models/Activity.ts` - Activity type
  - `backend/src/app/finca/actividad/ActividadDTO.ts` - Backend DTO (after Task 10)

  **WHY Each Reference Matters**:
  - Follow same patterns as CropsPage
  - Activity type must match backend DTO

  **Acceptance Criteria**:
  - [ ] Page loads activities from API
  - [ ] Create form has all required fields
  - [ ] Activities filterable by tipo
  - [ ] Each activity shows cultivo name
  - [ ] CRUD operations work

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Create actividad de fertilización
    Tool: Playwright
    Preconditions: Logged in, cultivo exists
    Steps:
      1. Navigate to /actividades
      2. Click "Nueva Actividad"
      3. Select tipo: "FERTILIZACION"
      4. Select cultivo from dropdown
      5. Fill fecha: today
      6. Fill descripcion: "Aplicación de abono orgánico"
      7. Click "Guardar"
    Expected Result: Activity appears in list
    Failure Indicators: Form error, activity not in list
    Evidence: .sisyphus/evidence/task-13-create-actividad.png

  Scenario: Filter activities by tipo
    Tool: Playwright
    Preconditions: Multiple activities with different tipos exist
    Steps:
      1. Navigate to /actividades
      2. Select filter: "RIEGO"
      3. Check list
    Expected Result: Only RIEGO activities visible
    Failure Indicators: Other tipos still visible
    Evidence: .sisyphus/evidence/task-13-filter.png
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `feat(frontend): connect activities, alerts, reports pages`
  - Files: `frontend/src/features/activities/pages/ActivitiesPage.tsx`

- [ ] 14. Connect AlertsPage to new backend

  **What to do**:
  - Modify `frontend/src/features/alerts/pages/AlertsPage.tsx`
  - Fetch alerts from `/api/alertas`
  - Display alerts with tipo icon/color coding
  - Show valor detectado and fecha
  - Link to related cultivo
  - Add ability to dismiss/delete alerts

  **Must NOT do**:
  - Don't implement push notifications
  - Don't add auto-refresh (polling)
  - Don't add alert sounds

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward data display page
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 13, 15)
  - **Blocks**: None
  - **Blocked By**: Task 11 (needs backend)

  **References**:

  **Pattern References**:
  - `frontend/src/features/alerts/pages/AlertsPage.tsx` - Current mock page
  - `frontend/src/features/activities/pages/ActivitiesPage.tsx` - Similar list page (after Task 13)

  **API/Type References**:
  - `frontend/src/shared/models/Alert.ts` - Alert type (may need update)
  - `backend/src/app/finca/alerta/AlertaDTO.ts` - Backend DTO (after Task 11)

  **WHY Each Reference Matters**:
  - AlertsPage is the file to modify
  - Follow same fetch/display pattern as activities

  **Acceptance Criteria**:
  - [ ] Page loads alerts from API
  - [ ] Alerts show tipo, valor, fecha
  - [ ] Color coding by tipo (red for high temp, blue for rain, etc.)
  - [ ] Can dismiss/delete alerts
  - [ ] Empty state when no alerts

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: View alerts list
    Tool: Playwright
    Preconditions: User has alerts in system
    Steps:
      1. Navigate to /alertas
      2. Wait for data load
      3. Check alert cards
    Expected Result: Alerts displayed with tipo, valor, fecha
    Failure Indicators: Mock data shown, empty list when data exists
    Evidence: .sisyphus/evidence/task-14-alerts-list.png

  Scenario: Dismiss alert
    Tool: Playwright
    Preconditions: At least one alert exists
    Steps:
      1. Navigate to /alertas
      2. Click dismiss/delete button on first alert
      3. Confirm if prompted
    Expected Result: Alert removed from list
    Failure Indicators: Alert persists, error message
    Evidence: .sisyphus/evidence/task-14-dismiss.png
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `feat(frontend): connect activities, alerts, reports pages`
  - Files: `frontend/src/features/alerts/pages/AlertsPage.tsx`

- [ ] 15. Connect ReportsPage to new backend

  **What to do**:
  - Modify `frontend/src/features/reports/pages/ReportsPage.tsx`
  - Add cultivo selector dropdown
  - Fetch report data from `/api/reportes/actividades/:cultivoId`
  - Display report summary (counts by tipo, date range)
  - Add "Descargar CSV" button that triggers `/api/reportes/actividades/:cultivoId/csv`
  - Show riegos and fertilizaciones summaries

  **Must NOT do**:
  - Don't add PDF download (deferred)
  - Don't add date range filter (keep simple)
  - Don't add charts/graphs

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Data display with download button
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 13, 14)
  - **Blocks**: None
  - **Blocked By**: Task 12 (needs backend)

  **References**:

  **Pattern References**:
  - `frontend/src/features/reports/pages/ReportsPage.tsx` - Current mock page
  - `frontend/src/features/crops/pages/CropsPage.tsx` - Dropdown pattern for cultivo

  **API/Type References**:
  - `backend/src/app/finca/reporte/ReporteController.ts` - Report endpoints (after Task 12)

  **External References**:
  - Blob download in JS: https://developer.mozilla.org/en-US/docs/Web/API/Blob

  **WHY Each Reference Matters**:
  - ReportsPage is the target file
  - Need to implement CSV download via blob

  **Acceptance Criteria**:
  - [ ] Cultivo dropdown populated from API
  - [ ] Selecting cultivo fetches report data
  - [ ] Report summary shows activity counts by tipo
  - [ ] CSV download button works
  - [ ] Downloaded file has correct data

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: View report for cultivo
    Tool: Playwright
    Preconditions: Cultivo with activities exists
    Steps:
      1. Navigate to /reportes
      2. Select cultivo from dropdown
      3. Wait for report data
    Expected Result: Report summary shows activity counts
    Failure Indicators: Empty report, loading forever
    Evidence: .sisyphus/evidence/task-15-report-view.png

  Scenario: Download CSV report
    Tool: Playwright
    Preconditions: Cultivo selected with activities
    Steps:
      1. On reports page with cultivo selected
      2. Click "Descargar CSV" button
      3. Check download initiated
    Expected Result: CSV file downloaded
    Failure Indicators: No download, error message
    Evidence: .sisyphus/evidence/task-15-download.png
  ```

  **Commit**: YES (groups with Wave 5)
  - Message: `feat(frontend): connect activities, alerts, reports pages`
  - Files: `frontend/src/features/reports/pages/ReportsPage.tsx`

---

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (login → create parcel → create crop → create activity). Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit Message | Files |
|------|---------------|-------|
| 1 | `feat(frontend): add apiClient methods and auth persistence` | apiClient.ts, authStore.ts, PrivateRoute.tsx |
| 2 | `feat(auth): connect login and register pages to backend` | LoginPage.tsx, RegisterPage.tsx, DashboardPage.tsx |
| 3 | `feat(frontend): connect parcels and crops with full CRUD` | ParcelsPage.tsx, CropsPage.tsx, ParcelForm.tsx, CropForm.tsx, App.tsx |
| 4 | `feat(backend): add actividades, alertas, reportes modules` | backend/src/app/finca/* (new files) |
| 5 | `feat(frontend): connect activities, alerts, reports pages` | ActivitiesPage.tsx, AlertsPage.tsx, ReportsPage.tsx |

---

## Success Criteria

### Verification Commands
```bash
# Backend running
curl http://localhost:3123/api/auth/me -H "Authorization: Bearer $TOKEN"
# Expected: 200 with user data

# Frontend running
curl http://localhost:5173
# Expected: 200 with HTML

# Full flow test
curl -X POST http://localhost:3123/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123456"}'
# Expected: 200 with { token, user }
```

### Final Checklist
- [ ] All "Must Have" features implemented and verified
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] All 9 pages functional (8 with real data, 1 mock)
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
