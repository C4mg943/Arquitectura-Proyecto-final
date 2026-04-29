ANÁLISIS EXHAUSTIVO DE ARQUITECTURA - PROYECTO PDIA

1. ARQUITECTURA GENERAL
   Tipo de Arquitectura Identificada
   Arquitectura de Microservicios con API Gateway
   Evidencia del Código
   La arquitectura se evidencia en:
2. docker-compose.yml: Define 9 servicios independientes (auth, farm, crop, activity, weather, alert, recommendation, report, notification) + PostgreSQL + RabbitMQ + API Gateway (nginx)
3. nginx.conf: Funciona como reverse proxy/entry point, distributendo tráfico a cada microservicio:
   /api/auth → auth-service:3001
   /api/fincas → farm-service:3002
   /api/cultivos → crop-service:3003
   /api/actividades → activity-service:3004
   /api/weather → weather-service:3005
   /api/alertas → alert-service:3006
   /api/recomendaciones → recommendation-service:3007
   /api/reports → report-service:3008
   /api/notifications → notification-service:3009
4. Comunicación asíncrona: Todos los servicios tienen config/rabbitmq.ts para publicar/suscribir eventos al exchange "pdia.events"
   Patrones de Diseño Presentes
   Patrón Aplicación
   Service Layer Cada servicio tiene carpeta services/ con lógica de negocio
   Repository Pattern Solo auth-service implementa repositorio dedicado (auth.repository.ts); otros usan pool directamente
   Middleware Pattern auth.middleware.ts para validación JWT en todas las rutas protegidas
   Event-Driven Publicación de eventos a RabbitMQ para comunicación inter-servicios
   DAO/Model Modelos con getters encapsulamiento (ej: User, Finca, Cultivo)

---

2. ESTRUCTURA DEL PROYECTO
   Carpeta Frontend
   frontend/
   ├── src/
   │ ├── main.tsx → Entry point React + Service Worker PWA
   │ ├── App.tsx → Router con todas las rutas
   │ ├── features/ → Páginas por dominio (auth, crops, alerts, etc.)
   │ │ ├── auth/pages/ → LoginPage, RegisterPage
   │ │ ├── crops/pages/ → CropsPage
   │ │ ├── dashboard/ → DashboardPage
   │ │ └── ...
   │ ├── shared/
   │ │ ├── components/ → UI Components (Button, Card, Input, Forms)
   │ │ ├── hooks/ → Custom hooks (useOffline)
   │ │ ├── models/ → TypeScript interfaces (Activity, Crop, Parcel)
   │ │ └── services/
   │ │ └── apiClient.ts → Cliente HTTP centralizado con JWT
   │ └── store/
   │ └── authStore.ts → Zustand (state management)
   ├── config/
   │ ├── vite.config.ts → Config Vite
   │ └── tsconfig.app.json → TypeScript config
   └── package.json → React 19 + Vite + Zustand + Tailwind
   Carpeta Microservicios
   microservicios/
   ├── docker-compose.yml → Orquestación completa
   ├── init-scripts/
   │ └── init.sql → Schema PostgreSQL (11 tablas)
   ├── api-gateway/
   │ ├── nginx.conf → Reverse proxy rules
   │ └── Dockerfile
   ├── auth-service/ → Puerto 3001
   │ ├── src/
   │ │ ├── index.ts → Express app + health endpoint
   │ │ ├── routes/ → auth.routes.ts
   │ │ ├── services/ → auth.service.ts (lógica auth)
   │ │ ├── repositories/ → auth.repository.ts (acca a BD)
   │ │ ├── models/ → user.model.ts (Entity)
   │ │ ├── middleware/ → auth.middleware.ts (JWT)
   │ │ └── config/ → db.ts, rabbitmq.ts
   ├── farm-service/ → Puerto 3002 (Fincas, Parcelas, Operarios)
   ├── crop-service/ → Puerto 3003 (Cultivos)
   ├── activity-service/ → Puerto 3004 (Actividades agrícolas)
   ├── weather-service/ → Puerto 3005 (Clima + jobs background)
   ├── alert-service/ → Puerto 3006 (Alertas climáticas)
   ├── recommendation-service/ → Puerto 3007 (Recomendaciones)
   ├── report-service/ → Puerto 3008 (Reportes, CSV export)
   └── notification-service/ → Puerto 3009 (Notificaciones push)

---

3. FLUJO COMPLETO DEL SISTEMA
   Flujo de una Request: Login → Dashboard → Ver Cultivos
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ FRONTEND (React 19 + Vite) │
   └─────────────────────────────────────────────────────────────────────────┘
   │
4. Usuario abre app → vite start (localhost:5173) │
5. Browser carga index.html + bundle.js │
6. LoginPage: usuario ingresa credenciales │
   │
7. apiClient.auth.login({email, password}) │
   └─→ POST http://localhost:8000/api/auth/login │
   └─→ Headers: Content-Type: application/json │
   │
   ▼ │
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ API GATEWAY (nginx :8000) │
   └─────────────────────────────────────────────────────────────────────────┘
   │
8. nginx recibe request /api/auth/login │
9. proxy_pass http://auth-service:3001/api/auth/login │
10. Pasa headers: Authorization, X-Real-IP, X-Forwarded-For │
    │
    ▼ │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ AUTH SERVICE (:3001) │
    └─────────────────────────────────────────────────────────────────────────┘
    │
11. Express recibe POST /api/auth/login │
12. Middleware global: express.json() │
    │
13. Route handler auth.routes.ts → authService.login() │
    │ │
    ▼ │
14. AuthService.login():
    - Busca usuario en BD: repository.findByEmail(email) │
    - Verifica password: bcrypt.compare(password, hash) │
    - Genera JWT: jwt.sign({userId, email, rol}, secret, {expiresIn}) │
    - Actualiza failed_attempts = 0 │
    - Publica evento: publishEvent("user.registered", {...}) → RabbitMQ │
      └─→ Returns {token: "...", user: {...}} │
      │
      │ │
      ▼ │
15. Response HTTP 200 + {token, user} │
    │
    ▼ │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ FRONTEND RECIBE RESPUESTA │
    └─────────────────────────────────────────────────────────────────────────┘
    │
16. apiClient decodifica JWT (decodeJwtPayload) │
17. Zustand store: authStore.set({token, user}) │
18. Redirect a /dashboard │
    │
    ═══════════════════════════════════════════════════════════════════════│
    │
19. DashboardPage carga → apiClient.fincas.list() │
    └─→ GET http://localhost:8000/api/fincas/finca │
    └─→ Header: Authorization: Bearer `<token>` │
    │
    ▼ │
20. nginx proxy_pass → farm-service:3002/api/fincas │
    │
    ▼ │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ FARM SERVICE (:3002) │
    └─────────────────────────────────────────────────────────────────────────┘
    │
21. Middleware: authMiddleware valida JWT │
22. Route: /api/fincas/finca → farmService.listFincas(userId) │
23. Query PostgreSQL: SELECT \* FROM fincas WHERE propietario_id = ? │
24. Response: Array`<Finca>` │
    │
    ═══════════════════════════════════════════════════════════════════════│
    │
25. Usuario hace click en "Cultivos" → CropsPage │
26. apiClient.cultivos.list() │
    └─→ GET http://localhost:8000/api/cultivos │
    │
    ▼ │
27. nginx → crop-service:3003/api/cultivos │
    │
    ▼ │
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ CROP SERVICE (:3003) │
    └─────────────────────────────────────────────────────────────────────────┘
    │
28. authMiddleware valida JWT + extrae userId │
29. Route: /api/cultivos → cropService.listByPropietario(userId) │
30. Query SQL: │
    SELECT c.\* FROM cultivos c │
    JOIN parcelas p ON c.parcela_id = p.id │
    JOIN fincas f ON p.finca_id = f.id │
    WHERE f.propietario_id = $1 │
    │
31. Response: Array`<Cultivo>` │
    │
    ▼ │
32. Frontend renderiza lista de cultivos │
    Resumen del Flujo por Capa
    Capa Componente
    Frontend apiClient.ts
    Gateway nginx.conf
    Microservicio Route
    Middleware
    Service
    Repository
    Model
    BD PostgreSQL

---

4. COMUNICACIÓN ENTRE MICROSERVICIOS
   Comunicación Síncrona (HTTP/REST)
   El API Gateway distribuye requests HTTP entre servicios. Algunos servicios también se comunican internamente:
   De A
   farm-service auth-service
   crop-service farm-service
   activity-service crop-service
   alert-service crop-service, weather-service
   report-service crop-service, activity-service
   Comunicación Asíncrona (RabbitMQ)
   Exchange: pdia.events (topic)
   Publicadores:
   ├── auth-service → user.registered
   ├── farm-service → parcela.created
   ├── crop-service → cultivo.created
   ├── activity-service → actividad.created
   ├── weather-service → weather.updated
   ├── alert-service → alerta.creada
   └── recommendation-service → recommendation.creada
   Suscriptores:
   └── notification-service
   ├── alertas.alerta.creada → Inserta en tabla notificaciones
   └── alertas.recommendation.creada → Inserta en tabla notificaciones
   Mapa de Dependencias
   ┌──────────────┐
   │ API Gateway │
   │ (nginx) │
   └──────┬───────┘
   │
   ┌─────────┬────────┼────────┬─────────┐
   ▼ ▼ ▼ ▼ ▼
   ┌────────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌──────────┐
   │ Auth │ │ Farm │ │ Crop │ │ Activity│ │ Weather │
   │ :3001 │ │ :3002│ │ :3003 │ │ :3004 │ │ :3005 │
   └───┬────┘ └──┬───┘ └───┬───┘ └───┬────┘ └──────┬───┘
   │ │ │ │ │
   │ │ │ ▼ │
   │ │ │ ┌──────────┐ │
   │ │ │ │ Alert │◄─────┘
   │ │ │ │ :3006 │
   │ │ │ └────┬─────┘
   │ │ │ │
   ▼ ▼ ▼ ▼
   ┌─────────────────────────────────────────┐
   │ PostgreSQL (:5432) │
   └─────────────────────────────────────────┘
   ▲
   ┌───────────────────┴───────────────────┐
   │ RabbitMQ (:5672) │
   │ Exchange: pdia.events (topic) │
   └─────────────────────────────────────────┘
   ▲
   │
   ┌────┴─────┐
   │Notif. │
   │ :3009 │
   └──────────┘

---

5. TECNOLOGÍAS UTILIZADAS
   Frontend
   Tecnología
   React
   Vite
   TypeScript
   Tailwind CSS
   Zustand
   React Router
   Zod
   Backend (Microservicios)
   Tecnología Versión
   Node.js -
   Express 4.18.2
   TypeScript 5.3.2
   PostgreSQL 15
   pg 8.11.3
   RabbitMQ 3-management
   amqplib 0.10.3
   JWT 9.0.2
   bcryptjs 2.4.3
   Infraestructura
   Tecnología
   Docker
   nginx

---

6. EJECUCIÓN DEL PROYECTO
   Requisitos Previos

- Docker + Docker Compose instalados
- Node.js (para desarrollo local sin Docker)
  Ejecución con Docker (Recomendado)

# 1. Ir a carpeta microservicios

cd microservicios

# 2. Levantar todos los servicios

docker-compose up --build

# 3. Servicios disponibles:

# - Frontend: http://localhost:5173 (desarrollo)

# - API Gateway: http://localhost:8000

# - PostgreSQL: localhost:5432 (db: pdia_db, user: postgres, pass: password)

# - RabbitMQ: http://localhost:15672 (user: guest, pass: guest)

Ejecución Frontend (Desarrollo Local)
cd frontend
npm install
npm run dev # localhost:5173
Ejecución Microservicios (Desarrollo Local)

# Cada servicio se ejecuta independientemente:

cd microservicios/auth-service
npm install
npm run dev # Puerto 3001

# (Repetir para cada servicio con sus respectivos puertos)

Variables de Entorno Críticas
Variable Descripción
PORT Puerto del servicio
DB_HOST Host PostgreSQL
DB_PORT Puerto PostgreSQL
DB_NAME Nombre BD
DB_USER Usuario BD
DB_PASSWORD Password BD
JWT_SECRET Clave JWT
RABBITMQ_HOST Host RabbitMQ
VITE_API_GATEWAY_URL URL Gateway (frontend)
Orden de Ejecución (Docker Compose)

1. rabbitmq (message broker)
2. postgres (base de datos)
3. auth-service
4. farm-service
5. crop-service
6. activity-service
7. weather-service
8. alert-service
9. recommendation-service
10. report-service
11. notification-service
12. api-gateway (nginx)

---

7. MODELO DE DATOS
   Entidades Principales (11 tablas)
   users (1) ──────< (N) fincas
   │
   └────< (N) password_reset_tokens
   │
   └────< (N) asignacion_operarios (como operario)
   │
   └────< (N) notificaciones
   fincas (1) ────< (N) parcelas
   parcelas (1) ─< (N) cultivos
   └────< (N) actividades
   └────< (N) alertas
   └────< (N) recomendaciones
   cultivos (1) ─< (N) actividades
   └────< (N) alertas
   └────< (N) recomendaciones
   asignacion_operarios: (N) parcelas <──> (N) operarios
   Tipos de Datos Clave
   Tabla
   users
   fincas
   parcelas
   cultivos
   actividades
   alertas
   recomendaciones
   notificaciones
   umbrales
   Base de Datos

- Tipo: SQL (PostgreSQL 15)
- Cantidad de tablas: 11
- Índices: 16 índices para optimización de queries
- Relaciones: Claves foráneas con DELETE CASCADE

---

8. PROBLEMAS Y MEJORAS
   🔴 Problemas Críticos
   Problema Descripción
   Sin API Gateway dedicado Usan nginx como gateway básico
   Secretos hardcodeados JWT_SECRET = "pdia-secret-key-change-in-production" en docker-compose
   Base de datos compartida Todos los servicios usan la misma BD pdia_db
   Sin service discovery URLs hardcodeadas en docker-compose (http://farm-service:3002 (http://farm-service:3002))
   Sin tests package.json tiene "test": "jest" pero no hay tests implementados
   🟡 Problemas Importantes
   Problema
   Inconsistencia en patrón Repository
   Sin validación centralizada
   JWT sin blacklist
   Sin Circuit Breaker
   Logging inconsistente
   🟢 Sugerencias de Mejora
9. Separar bases de datos: Cada microservicio debería tener su propia BD (Database per Service pattern)
10. Implementar Health Checks completos: Agregar verificaciones de dependencias (BD, RabbitMQ) en cada servicio
11. Agregar circuit breaker: Usar librería como opossum para manejar fallas en cascada
12. Centralizar logs: Integrar ELK Stack o similar para logs agregados
13. Implementar API Gateway robusto: Considerar Kong, Apigee, o AWS API Gateway en lugar de nginx básico
14. Agregar tests: Implementar Jest unit tests para services y repositorios
15. Documentación API: Generar Swagger/OpenAPI para cada servicio
16. CI/CD: Agregar GitHub Actions para build, test y deploy automáticos

---

9. RESUMEN EJECUTIVO
   ¿Qué hace el sistema?
   PDIA (Sistema de Gestión Agrícola) es una plataforma web que permite a agricultores y productores gestionar sus fincas, parcelas, cultivos y actividades agrícolas de manera digital.
   Funcionalidades Principales
10. Gestión de Usuarios: Registro, login, recuperación de contraseña, roles (Productor/Operario/Técnico)
11. Administración de Fincas: Crear/editar/eliminar fincas con información de ubicación y tamaño
12. Parcelas: Division de fincas en parcelas con coordenadas GPS
13. Cultivos: Seguimiento de siembros con estados (en crecimiento/cosechado/afectado)
14. Actividades Agrícolas: Registro de riegos, fertilizaciones, control de plagas y observaciones
15. Clima: Integración con Open-Meteo API para obtener clima actual y pronóstico por parcela
16. Alertas: Generación automática de alertas por condiciones climáticas extremas
17. Recomendaciones: Sugerencias automáticas basadas en clima y actividades
18. Reportes: Generación de reportes de actividades y exportación CSV
19. Notificaciones: Sistema de notificaciones push
