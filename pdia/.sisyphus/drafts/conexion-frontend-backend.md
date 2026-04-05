# Draft: Conexión Frontend-Backend PDIA

## Objetivo
Conectar completamente el frontend React con el backend Express, incluyendo:
- Autenticación (login/registro)
- CRUD de parcelas
- CRUD de cultivos
- Actividades agrícolas
- Clima (Open-Meteo)
- Alertas
- Reportes

## Estructura Detectada

### Backend (Express + TypeScript)
**Módulos identificados:**
- `auth/` - Autenticación JWT
- `parcelas/` - Gestión de parcelas (llamado "finca" en código)
- `cultivos/` - Gestión de cultivos

**Patrón:** Controller → Service → Repository → PostgreSQL

### Frontend (React + TypeScript + Tailwind)
**Features identificadas:**
- `auth/` - Login y Registro
- `parcels/` - Parcelas
- `crops/` - Cultivos
- `activities/` - Actividades
- `weather/` - Clima
- `alerts/` - Alertas
- `reports/` - Reportes
- `dashboard/` - Panel principal

**Archivos clave:**
- `apiClient.ts` - Cliente HTTP
- `authStore.ts` - Estado de autenticación

---

## Hallazgos de Exploración

### Endpoints Backend (CONFIRMADO)
**13 endpoints totales implementados:**

| Módulo | Endpoint | Método | Auth |
|--------|----------|--------|------|
| Auth | `/api/auth/register` | POST | ❌ |
| Auth | `/api/auth/login` | POST | ❌ |
| Auth | `/api/auth/me` | GET | ✅ |
| Parcelas | `/api/parcelas` | GET | ✅ |
| Parcelas | `/api/parcelas/:id` | GET | ✅ |
| Parcelas | `/api/parcelas` | POST | ✅ |
| Parcelas | `/api/parcelas/:id` | PUT | ✅ |
| Parcelas | `/api/parcelas/:id` | DELETE | ✅ |
| Cultivos | `/api/cultivos` | GET | ✅ |
| Cultivos | `/api/cultivos/:id` | GET | ✅ |
| Cultivos | `/api/cultivos` | POST | ✅ |
| Cultivos | `/api/cultivos/:id` | PUT | ✅ |
| Cultivos | `/api/cultivos/:id` | DELETE | ✅ |

### Páginas Frontend - Estado Actual (CONFIRMADO)

| Página | Ruta | Conectada a API | Estado |
|--------|------|-----------------|--------|
| LoginPage | `/login` | ❌ NO | UI completa, sin lógica |
| RegisterPage | `/register` | ❌ NO | UI completa, falta identificación |
| DashboardPage | `/` | ❌ NO | Datos mock hardcodeados |
| ParcelsPage | `/parcelas` | ❌ NO | Datos mock hardcodeados |
| CropsPage | `/cultivos` | ❌ NO | Datos mock hardcodeados |
| ActivitiesPage | `/actividades` | ❌ NO (backend no existe) | Datos mock |
| WeatherPage | `/clima` | ❌ NO (backend no existe) | Datos mock |
| AlertsPage | `/alertas` | ❌ NO (backend no existe) | Datos mock |
| ReportsPage | `/reportes` | ❌ NO (backend no existe) | Datos mock |

### Problemas Detectados

1. **apiClient.ts**: Solo tiene un método `probarConexion()`, NO tiene métodos para auth, parcelas, cultivos
2. **authStore.ts**: Solo guarda token, NO persiste en localStorage
3. **RegisterPage**: Falta campo `identificacion` que el backend requiere
4. **Rutas no protegidas**: App.tsx tiene código comentado para PrivateRoute
5. **Formularios vacíos**: `ParcelForm.tsx` y `CropForm.tsx` están vacíos (0 líneas)
6. **Modelos incompletos**: Crop.ts no tiene `fechaSiembra` ni `parcelaId`

### Backend NO implementado (fuera de alcance)
- ❌ Actividades (RIEGO, FERTILIZACION, PLAGA, OBSERVACION)
- ❌ Clima (integración Open-Meteo)
- ❌ Alertas automáticas
- ❌ Recomendaciones
- ❌ Reportes PDF/CSV

---

## Decisiones Técnicas Confirmadas

### Configuración detectada:
- **Backend Puerto**: 3123
- **Frontend API URL**: `http://localhost:3123`
- **JWT Secret**: `dev-secret-change` (default)
- **BD**: PostgreSQL local (Proyecto)

### Test Strategy Decision
- **Infrastructure exists**: SÍ (jest configurado en backend)
- **Automated tests**: Por confirmar con usuario
- **Agent-Executed QA**: SIEMPRE

---

## Scope Boundaries (ACTUALIZADO)

### INCLUDE (lo que haremos):
1. **Auth completo**: Login funcional, Registro con todos los campos, persistencia de token
2. **Protección de rutas**: Implementar PrivateRoute
3. **apiClient expandido**: Métodos para auth, parcelas, cultivos
4. **ParcelsPage conectada**: CRUD real con backend
5. **CropsPage conectada**: CRUD real con backend
6. **DashboardPage**: Datos reales de parcelas/cultivos del usuario
7. **Formularios**: ParcelForm y CropForm funcionales

### PARCIALMENTE INCLUDE (conectar UI pero sin backend):
- **WeatherPage**: Conectar directamente a Open-Meteo desde frontend
- **AlertsPage**: Mostrar alertas basadas en datos climáticos (lógica frontend)

### EXCLUDE (backend no existe):
- ❌ ActivitiesPage con backend (no hay endpoints)
- ❌ ReportsPage con generación real (no hay endpoints)
- ❌ Crear nuevos endpoints en backend (fuera de alcance)

---

## Open Questions (ACTUALIZADAS)
1. ~~¿Hay variables de entorno configuradas?~~ → SÍ, confirmado
2. ¿El backend está corriendo actualmente? (necesario para pruebas)
3. ¿La base de datos tiene el schema creado?
4. ¿Quieres que WeatherPage consulte Open-Meteo directamente o prefieres dejarlo mock?
5. ¿Incluimos tests unitarios o solo QA manual?
