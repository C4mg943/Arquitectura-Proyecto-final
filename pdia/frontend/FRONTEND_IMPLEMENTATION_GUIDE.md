# FRONTEND IMPLEMENTATION GUIDE — PDIA

> Documento operativo para que otro AI implemente el frontend completo de PDIA dentro de este repositorio.
> **No es análisis teórico**: es una especificación ejecutable por fases, con rutas, archivos, estado, criterios de aceptación y trazabilidad RF.

---

## 0) Objetivo de este documento

Implementar un frontend **React + TypeScript + Tailwind + Zustand + Zod** que cubra los requisitos funcionales **RF01–RF71** (sin RF25 porque no existe en el enunciado), respetando:

- stack fijo del proyecto,
- arquitectura orientada a objetos,
- UX mobile-first para Android gama baja,
- operación offline para actividades agrícolas,
- integración con backend Express (entregable actual) y Open-Meteo.

---

## 1) Restricciones no negociables

1. **No cambiar stack**.
2. Backend actual del entregable: **Node + Express + TypeScript (sin NestJS)**.
3. Frontend en **TypeScript estricto**, sin `any`.
4. Paradigma OOP obligatorio: mantener y extender modelos de dominio con clases.
5. Interfaz **mobile-first**, lenguaje simple en español para el usuario final.
6. Código en inglés (nombres de variables, clases, funciones), texto UI en español.
7. Debe existir modo offline real para registro de actividades (RF45–RF47, RF59, RF60).

---

## 2) Estado actual real del repositorio (baseline)

### 2.1 Frontend existente

- Rutas actuales (`src/App.tsx`):
  - `/login`, `/register`, `/`, `/parcelas`, `/cultivos`, `/actividades`, `/clima`, `/alertas`, `/reportes`, `*`.
- Páginas:
  - `LoginPage` y `RegisterPage` con formularios visuales base (sin lógica real completa).
  - `DashboardPage` prueba conexión backend (`apiClient.probarConexion`).
  - Resto de páginas: placeholders.
- Shared existente:
  - Modelos: `User`, `Parcel`, `Crop`, `Activity`.
  - Hook: `useOffline`.
  - Validador base: `loginSchema`.
  - Store mínima: `authStore` solo `token`.
- PWA:
  - `public/service-worker.js` básico con cache estático.

### 2.2 Backend real actual

- Solo endpoint operativo: `GET /` → `{ mensaje: "servidor iniciado" }`.
- No hay módulos REST funcionales todavía.

### 2.3 Variables de entorno

- Frontend ya usa `VITE_API_URL`.
- Valor local actual esperado: `http://localhost:3123`.

---

## 3) Resultado esperado (definition of done global)

Al finalizar, el frontend debe:

1. Tener navegación completa por rol (Productor, Operario, Técnico, Admin).
2. Consumir endpoints modulares con capa de servicios tipada.
3. Implementar formularios con Zod + manejo de errores visible.
4. Soportar operación offline para actividades con cola local y sincronización.
5. Mostrar clima, alertas, recomendaciones, notificaciones, reportes y panel admin.
6. Mantener coherencia visual, accesibilidad básica y rendimiento para móvil.

---

## 4) Arquitectura objetivo del frontend

> Mantener lo existente y completar esta estructura (puedes crear carpetas faltantes).

```text
src/
  features/
    auth/
      pages/
      components/
      schemas/
      services/
    dashboard/
      pages/
      components/
    parcels/
      pages/
      components/
      schemas/
      services/
    crops/
      pages/
      components/
      schemas/
      services/
    activities/
      pages/
      components/
      schemas/
      services/
    weather/
      pages/
      components/
      services/
    alerts/
      pages/
      components/
      services/
    recommendations/
      pages/
      components/
      services/
    notifications/
      pages/
      components/
      services/
    reports/
      pages/
      components/
      schemas/
      services/
    admin/
      pages/
      components/
      services/
    technician/
      pages/
      components/
      services/
  shared/
    components/
      common/
      layout/
      feedback/
    hooks/
    models/
    services/
      api/
      storage/
      sync/
    types/
    utils/
  store/
```

---

## 5) Rutas requeridas (actualizar `App.tsx`)

### Públicas

- `/login`
- `/register`
- `/recuperar-password`

### Protegidas comunes

- `/` (dashboard)
- `/perfil`
- `/notificaciones`

### Productor / Admin agrícola

- `/parcelas`
- `/parcelas/:parcelId`
- `/cultivos`
- `/cultivos/:cropId`
- `/actividades`
- `/clima`
- `/alertas`
- `/recomendaciones`
- `/reportes`
- `/operarios`

### Técnico

- `/tecnico/cultivos`
- `/tecnico/productores/:producerId/actividades`

### Admin plataforma

- `/admin/usuarios`
- `/admin/limites-alerta`
- `/admin/logs`
- `/admin/estadisticas`

### Fallback

- `*` → `NotFoundPage`

---

## 6) Seguridad, sesión y autorización (frontend)

Implementar:

1. `PrivateRoute` con redirección a `/login` si no hay sesión.
2. `RoleRoute` para restringir rutas por rol.
3. `authStore` extendido:
   - `token`, `refreshToken?`, `user`, `role`, `isAuthenticated`, `login()`, `logout()`, `hydrateFromStorage()`.
4. Persistencia segura mínima en `localStorage` (o `sessionStorage` según estrategia).
5. Interceptor en cliente HTTP para agregar `Authorization: Bearer <token>`.
6. Manejo de `401/403`: limpiar sesión + redirigir.

---

## 7) Capa API (crear/reestructurar en `shared/services/api`)

### 7.1 Cliente HTTP base

Crear `httpClient.ts` con:

- `request<T>(method, path, body?, query?, signal?)`
- parseo seguro JSON,
- timeout,
- manejo de errores de red,
- normalización de respuesta.

### 7.2 Contrato de respuesta esperado

Preferido por arquitectura:

- éxito: `{ success: true, data, meta? }`
- error: `{ success: false, message, errors? }`

Como el backend actual aún no cumple todo, implementar `normalizeApiResponse` para tolerar respuestas temporales (ej. `{ mensaje: ... }`) sin romper la UI.

### 7.3 Endpoints objetivo por módulo

> El backend puede variar en nombres finales; el frontend debe encapsularlos en services por módulo para ajustar fácil.

#### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/logout`
- `GET /auth/me`

#### Users / Operarios

- `GET /users/me`
- `PUT /users/me`
- `GET /users/operators`
- `POST /users/operators`
- `POST /users/operators/:operatorId/assignments`
- `DELETE /users/operators/:operatorId/assignments/:parcelId`

#### Parcelas

- `GET /parcels`
- `POST /parcels`
- `GET /parcels/:id`
- `PUT /parcels/:id`
- `DELETE /parcels/:id`

#### Cultivos

- `GET /crops`
- `GET /crops?query=<tipoCultivo>`
- `POST /crops`
- `GET /crops/:id`
- `PUT /crops/:id`
- `DELETE /crops/:id`

#### Actividades

- `GET /activities?cropId=&type=`
- `POST /activities`
- `PUT /activities/:id`
- `DELETE /activities/:id`
- `POST /activities/sync-batch` (sincronización offline)

#### Clima

- `GET /weather/current?parcelId=`
- `GET /weather/forecast?parcelId=&days=5`

#### Alertas

- `GET /alerts`
- `GET /alerts/history`
- `PATCH /alerts/:id/read`

#### Recomendaciones

- `GET /recommendations`
- `GET /recommendations/history`
- `PATCH /recommendations/:id/read`

#### Notificaciones

- `GET /notifications`
- `GET /notifications/history`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

#### Reportes

- `GET /reports/activities?cropId=&format=pdf|csv`
- `GET /reports/irrigations?cropId=&format=pdf|csv`
- `GET /reports/fertilizations?cropId=&format=pdf|csv`

#### Admin

- `GET /admin/users`
- `GET /admin/logs`
- `GET /admin/stats`
- `GET /admin/alert-thresholds`
- `PUT /admin/alert-thresholds/:cropType`

#### Técnico

- `GET /technician/crops`
- `GET /technician/producers/:producerId/activities`
- `POST /technician/crops/:cropId/notes`
- `GET /technician/recommendations`

---

## 8) Modelado OOP en frontend (extender `shared/models`)

Mantener clases existentes (`User`, `Parcel`, `Crop`, `Activity`) y añadir:

- `WeatherData`
- `WeatherForecastDay`
- `Alert`
- `Recommendation`
- `Notification`
- `OperatorAssignment`

Cada clase debe incluir al menos:

1. constructor tipado,
2. factory estática `fromApi(raw)`,
3. método `toPlainObject()` para serialización,
4. helpers de negocio simples (ej. `isCriticalAlert()`).

---

## 9) Estado global (Zustand)

Crear stores por dominio (mínimo):

- `authStore`
- `parcelsStore`
- `cropsStore`
- `activitiesStore`
- `weatherStore`
- `alertsStore`
- `recommendationsStore`
- `notificationsStore`
- `adminStore`

Convenciones:

- estado normalizado,
- flags `isLoading`, `error`, `lastUpdatedAt`,
- acciones async en services,
- sin lógica de negocio compleja en componentes.

---

## 10) Validación con Zod

Crear esquemas por módulo:

- `auth`: login, register, forgot/reset password.
- `parcels`: create/update parcel.
- `crops`: create/update crop + filtros búsqueda.
- `activities`: discriminated union por tipo (`RIEGO`, `FERTILIZACION`, `PLAGA`, `OBSERVACION`).
- `reports`: filtros y formato exportación.
- `admin`: configuración de límites.

Mostrar errores de validación en UI campo por campo.

---

## 11) Especificación funcional por pantalla

### 11.1 Auth

**LoginPage**

- Inputs: email, password.
- Botón submit real.
- Manejar intentos fallidos y bloqueo temporal (RF52).
- Redirección por rol tras login.

**RegisterPage**

- Inputs: nombre, identificación, email, password, confirmPassword.
- Validar email único vía respuesta backend (RF02).

**RecoverPasswordPage (nueva)**

- Input email + feedback de envío de enlace (RF04).

### 11.2 Dashboard

- Resumen de:
  - parcelas,
  - cultivos,
  - actividades recientes,
  - alertas activas,
  - notificaciones nuevas.
- CTA rápidos a registrar actividad/cultivo/parcela.
- Banner offline global visible (RF59).

### 11.3 Parcelas

- CRUD completo con modal o pantalla dedicada.
- Tabla/lista con nombre, municipio, hectáreas.
- Gestión operarios (asignar/desasignar).

### 11.4 Cultivos

- CRUD completo asociado a parcela.
- Filtro por tipo cultivo (RF39, RF40).
- Vista detalle del cultivo con tabs:
  - actividades,
  - alertas,
  - recomendaciones,
  - clima relacionado.

### 11.5 Actividades

- Crear actividad por tipo.
- Lista cronológica + filtros por tipo (RF15–RF17).
- Si offline:
  - guardar en cola local,
  - etiquetar como "pendiente de sincronizar",
  - sincronizar al volver internet (RF45–RF47, RF60).

### 11.6 Clima

- Selector de parcela.
- Mostrar temperatura, humedad, lluvia, viento actual.
- Pronóstico 5 días.
- Auto-refresh programado (RF23).

### 11.7 Alertas

- Historial de alertas con fecha, tipo, valor.
- Filtros por cultivo/parcela/tipo/fecha.
- Distinción visual de criticidad.

### 11.8 Recomendaciones (nueva)

- Listado por cultivo con tipo y fecha.
- Historial consultable.
- Marcar como leída/atendida.

### 11.9 Notificaciones (nueva)

- Feed de notificaciones (alertas + recomendaciones nuevas).
- Marcar una o todas como leídas.
- Historial.

### 11.10 Reportes

- Formulario: tipo reporte + cultivo + rango fecha + formato.
- Descarga PDF/CSV por blob.
- Mensajes claros de éxito/error.

### 11.11 Operarios (nueva)

- Registrar operario.
- Listar operarios y parcelas asignadas.
- Asignar/desasignar operario a parcela.

### 11.12 Técnico (nuevas vistas)

- Listar cultivos de productores asignados.
- Consultar historial de actividades por productor.
- Registrar observación técnica.
- Consultar recomendaciones.

### 11.13 Admin (nuevas vistas)

- Gestión de usuarios.
- Configuración de umbrales de alerta por tipo de cultivo.
- Visualización de logs.
- Estadísticas globales.

---

## 12) Offline y sincronización (crítico)

Implementar en `shared/services/storage` y `shared/services/sync`:

1. **IndexedDB queue** para actividades (`pendingActivities`).
2. Estructura recomendada:

```ts
type PendingActivityRecord = {
  localId: string
  payload: {
    cropId: number
    type: 'RIEGO' | 'FERTILIZACION' | 'PLAGA' | 'OBSERVACION'
    date: string
    description: string
    extra?: Record<string, unknown>
  }
  createdAt: string
  retries: number
}
```

3. Al crear actividad sin internet: guardar en IndexedDB y reflejar en UI.
4. Al evento `online`: ejecutar sincronización por lotes.
5. Si falla sincronización: aumentar `retries`, mantener registro.
6. No perder registros al cerrar app (persistencia real).

---

## 13) UX/UI obligatoria para contexto rural

- Layout mobile-first (360px+).
- Botones grandes, espacios cómodos, tipografía legible.
- Estados claros: cargando, vacío, error, éxito, offline.
- No saturar con texto técnico.
- Navegación simple:
  - encabezado,
  - menú inferior para móvil o menú lateral adaptativo.
- Accesibilidad mínima:
  - labels visibles,
  - contraste adecuado,
  - foco visible,
  - feedback inmediato.

---

## 14) Trazabilidad RF → UI/Frontend

| RF | Implementación frontend | Vista principal |
|---|---|---|
| RF01 | Form registro productor con campos obligatorios | RegisterPage |
| RF02 | Error visual de email duplicado al registrar | RegisterPage |
| RF03 | Login con email/password | LoginPage |
| RF04 | Flujo recuperar contraseña | RecoverPasswordPage |
| RF05 | Form edición de perfil | ProfilePage |
| RF06 | Form crear cultivo | CropsPage |
| RF07 | Selector estado cultivo | CropsPage |
| RF08 | Form editar cultivo | CropDetailPage |
| RF09 | Confirmación eliminar cultivo + refresh listado | CropDetailPage |
| RF10 | Lista de cultivos con campos clave | CropsPage |
| RF11 | Registro observaciones | ActivitiesPage |
| RF12 | Registro riego (fecha/cantidad/obs) | ActivitiesPage |
| RF13 | Registro fertilización | ActivitiesPage |
| RF14 | Registro control plagas | ActivitiesPage |
| RF15 | Historial de actividades por cultivo | CropDetailPage |
| RF16 | Orden cronológico en historial | CropDetailPage |
| RF17 | Filtro por tipo de actividad | ActivitiesPage |
| RF18 | Mostrar temperatura actual | WeatherPage |
| RF19 | Mostrar humedad relativa | WeatherPage |
| RF20 | Mostrar probabilidad de lluvia | WeatherPage |
| RF21 | Mostrar velocidad del viento | WeatherPage |
| RF22 | Pronóstico de 5 días | WeatherPage |
| RF23 | Refresco automático de datos climáticos | WeatherPage |
| RF24 | Visualización alerta lluvia > 70% | AlertsPage |
| RF26 | Visualización alerta por alta temperatura | AlertsPage |
| RF27 | Visualización alerta por baja temperatura | AlertsPage |
| RF28 | Historial con fecha/tipo/valor alerta | AlertsPage |
| RF29 | Consulta historial alertas | AlertsPage |
| RF30 | Mostrar recomendación de riego | RecommendationsPage |
| RF31 | Mostrar recomendación de fertilización | RecommendationsPage |
| RF32 | Mostrar recomendaciones en vista cultivo | CropDetailPage |
| RF33 | Historial con fecha/tipo/cultivo recomendación | RecommendationsPage |
| RF34 | Consulta historial recomendaciones | RecommendationsPage |
| RF35 | Notificación por nueva alerta | NotificationsPage |
| RF36 | Notificación por nueva recomendación | NotificationsPage |
| RF37 | Sección visible de notificaciones | NotificationsPage |
| RF38 | Historial de notificaciones | NotificationsPage |
| RF39 | Buscador de cultivos por tipo | CropsPage |
| RF40 | Resultados de búsqueda de cultivos | CropsPage |
| RF41 | Generar reporte actividades por cultivo | ReportsPage |
| RF42 | Generar reporte riegos | ReportsPage |
| RF43 | Generar reporte fertilizaciones | ReportsPage |
| RF44 | Exportar PDF/CSV | ReportsPage |
| RF45 | Registrar actividades offline | ActivitiesPage |
| RF46 | Almacenar localmente offline | ActivitiesPage + IndexedDB |
| RF47 | Sincronizar automático al volver conexión | SyncService |
| RF48 | Mostrar acciones registradas (admin) | AdminLogsPage |
| RF49 | Visualizar registro de actividades del sistema | AdminLogsPage |
| RF50 | Mostrar estadísticas globales | AdminStatsPage |
| RF51 | Cierre de sesión seguro | AppLayout / AuthStore |
| RF52 | Bloqueo temporal tras 5 intentos fallidos | LoginPage |
| RF53 | Form registrar parcela | ParcelsPage |
| RF54 | Form editar parcela | ParcelDetailPage |
| RF55 | Eliminar parcela y actualizar UI | ParcelDetailPage |
| RF56 | Listar parcelas (nombre/municipio/hectáreas) | ParcelsPage |
| RF57 | Visualizar alerta viento > 50 km/h | AlertsPage |
| RF58 | Mostrar recomendación fitosanitaria por plaga | RecommendationsPage |
| RF59 | Indicador visual modo offline | OfflineBanner |
| RF60 | Persistencia offline ante cierre inesperado | IndexedDB queue |
| RF61 | Configurar umbrales de alerta por cultivo | AdminThresholdsPage |
| RF62 | Técnico consulta cultivos asignados | TechnicianCropsPage |
| RF63 | Técnico consulta historial productor | TechnicianProducerActivitiesPage |
| RF64 | Técnico registra observación técnica | TechnicianCropDetailPage |
| RF65 | Técnico consulta recomendaciones | TechnicianRecommendationsPage |
| RF66 | Productor registra operario | OperatorsPage |
| RF67 | Productor asigna operario a parcela | OperatorsPage / ParcelsPage |
| RF68 | Productor desasigna operario | OperatorsPage / ParcelsPage |
| RF69 | Operario inicia sesión | LoginPage |
| RF70 | Operario solo ve parcelas/cultivos asignados | Dashboard + Parcels/Crops guards |
| RF71 | Productor consulta operarios y asignaciones | OperatorsPage |

---

## 15) Orden recomendado de implementación (ejecutable)

1. **Infraestructura base**
   - Router protegido por auth/rol.
   - `httpClient` + normalizador de respuesta.
   - `authStore` completo.

2. **Auth completo**
   - login/register/recover/profile/logout.

3. **Módulos core Productor**
   - parcelas, cultivos, actividades (incluye offline).

4. **Clima + alertas + recomendaciones + notificaciones**

5. **Reportes + exportación**

6. **Operarios + vistas Técnico + vistas Admin**

7. **Pulido final**
   - estados vacíos, errores, loading,
   - UX móvil,
   - QA manual end-to-end.

---

## 16) Checklist de aceptación final

- [ ] Todas las rutas requeridas existen y funcionan.
- [ ] Auth y guards por rol funcionando.
- [ ] CRUD parcelas/cultivos/actividades implementado.
- [ ] Modo offline real + sincronización automática.
- [ ] Clima, alertas, recomendaciones y notificaciones visibles.
- [ ] Reportes PDF/CSV descargables.
- [ ] Panel técnico y panel admin funcionales.
- [ ] Trazabilidad RF01–RF71 cubierta en UI.
- [ ] Build TypeScript/Vite sin errores.
- [ ] Código consistente con convenciones del proyecto.

---

## 17) Nota para el AI implementador

Si un endpoint backend aún no existe, **NO bloquees la implementación de UI**:

1. encapsula la llamada en un service,
2. maneja fallback con estado vacío/error,
3. deja TODO técnico breve en el archivo del service,
4. evita hardcodear lógica de negocio en componentes.

La prioridad es dejar un frontend robusto, tipado, navegable y listo para conectar al backend completo cuando el equipo termine el schema y los módulos REST.

---

## 18) Prompt maestro (copy/paste) para otra IA

Usa este prompt completo para maximizar calidad de implementación:

```text
You are a senior frontend engineer. Implement the PDIA frontend inside the current repository at `pdia/frontend`.

MANDATORY CONTEXT:
- Read and follow `pdia/frontend/FRONTEND_IMPLEMENTATION_GUIDE.md` strictly.
- Respect fixed stack: React + TypeScript + Tailwind + Zustand + Zod + Vite.
- Keep OOP modeling in frontend domain classes.
- Do not change backend technology assumptions.
- UI language for users: Spanish. Code identifiers: English.

PRIMARY GOAL:
Deliver a production-like, coherent, mobile-first frontend with good visual quality and complete navigation, mapped to RF01–RF71 in the guide.

IMPLEMENTATION RULES:
1) Build feature-by-feature in this order:
   a. Core infrastructure (router guards, auth store, http client)
   b. Auth
   c. Parcels + Crops + Activities (with offline queue + sync)
   d. Weather + Alerts + Recommendations + Notifications
   e. Reports
   f. Operators + Technician views + Admin views
2) No `any`, no dead code, no fake placeholder pages left behind.
3) Services must encapsulate API details; components must stay presentation-focused.
4) Use Zod for all form validation with visible field-level errors.
5) Add loading/empty/error/success/offline states for all key pages.
6) Keep UX simple for rural users on low-end Android devices.

VISUAL QUALITY BAR:
- Mobile-first (360px+), clean spacing, clear hierarchy.
- Consistent card system, buttons, forms, badges, alerts.
- Strong readability (contrast, font size, touch target size).
- Coherent color language:
  - success/normal: green family,
  - warning: amber,
  - critical: red,
  - neutral surfaces: slate.
- Avoid generic/raw scaffolding look.

DELIVERABLE FORMAT:
- Implement code directly in repo.
- After each phase: provide changed files and what was implemented.
- Run and report: typecheck/build/tests (if available).
- End with checklist showing RF coverage progress.
```

---

## 19) Criterios para que el frontend quede “bonito y con sentido”

Cuando evalúes el resultado de otra IA, exige estos puntos:

1. **Coherencia visual global**
   - misma escala de espaciado,
   - misma tipografía,
   - mismos estilos de botones/inputs/tarjetas.

2. **Jerarquía clara por pantalla**
   - título,
   - resumen,
   - acción principal,
   - contenido secundario.

3. **Feedback en todo flujo**
   - acciones muestran estados (`loading`, `error`, `success`),
   - no hay “botones muertos”.

4. **UX de campo (realista para productores)**
   - textos simples,
   - formularios cortos,
   - indicadores visibles de offline/sincronización.

5. **Navegación intuitiva**
   - usuario entiende en menos de 10 segundos dónde registrar parcela/cultivo/actividad.

6. **Consistencia de negocio**
   - alertas y recomendaciones se muestran como generadas por sistema,
   - operario no ve datos fuera de sus asignaciones,
   - técnico y admin tienen vistas separadas.

---

## 20) Estrategia recomendada de uso con otra IA

Para mejor resultado, pásale SIEMPRE:

1. `pdia/AGENTS.md`
2. `pdia/frontend/FRONTEND_IMPLEMENTATION_GUIDE.md`
3. Este mandato corto:

```text
Implementa el frontend completo por fases en este repo, no te quedes en scaffolding.
Cada fase debe quedar funcional, visualmente consistente y con estados UX completos.
```

Si no le pasas esos tres elementos, la calidad baja mucho y suele devolverte un frontend superficial.
