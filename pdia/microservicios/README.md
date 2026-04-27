# PDIA - Plataforma Digital de Agricultura Inteligente
## Arquitectura de Microservicios

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **auth-service** | 3001 | Autenticación, usuarios, login/registro |
| **farm-service** | 3002 | Fincas, parcelas, operarios |
| **crop-service** | 3003 | Cultivos y su ciclo de vida |
| **activity-service** | 3004 | Actividades agrícolas |
| **weather-service** | 3005 | Integración Open-Meteo |
| **alert-service** | 3006 | Generación automática de alertas |
| **recommendation-service** | 3007 | Motor de recomendaciones |
| **report-service** | 3008 | Generación de reportes |
| **notification-service** | 3009 | Notificaciones in-app |

### Infraestructura

- **API Gateway**: nginx (puerto 8000)
- **Message Broker**: RabbitMQ (puerto 5672, UI en 15672)
- **Base de Datos**: PostgreSQL (puerto 5432)

### Inicio Rápido

```bash
cd pdia/microservicios

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps
```

### Endpoints del API Gateway

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/fincas
POST   /api/fincas
GET    /api/parcelas
POST   /api/parcelas
GET    /api/operarios
POST   /api/operarios

GET    /api/cultivos
POST   /api/cultivos
GET    /api/cultivos/search?tipo=

GET    /api/activities
POST   /api/activities

GET    /api/weather/current/:parcelaId
GET    /api/weather/forecast/:parcelaId

GET    /api/alertas
PUT    /api/alertas/:id/read

GET    /api/recommendations

GET    /api/reports/activities/:cultivoId
GET    /api/reports/riegos/:cultivoId
GET    /api/reports/export/csv/:cultivoId

GET    /api/notifications
```

### Variables de Entorno

Crear `.env` en cada servicio:

```env
NODE_ENV=docker
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pdia_db
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
```

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────┐
│                nginx (port 8000)                │
│                 API Gateway                      │
└──────┬──────────────────────────────────┬───────┘
       │                                  │
  ┌────▼─────┐  ┌──────┐  ┌────────┐  ┌──▼─────┐
  │  auth   │  │ farm │  │  crop  │  │activity│
  │ :3001   │  │:3002 │  │ :3003  │  │ :3004  │
  └────┬─────┘  └──┬───┘  └───┬────┘  └───┬────┘
       │           │          │          │
  ┌────▼───────────▼──────────▼──────────▼────┐
  │            PostgreSQL (5432)              │
  └───────────────────────────────────────────┘
       │
  ┌────▼─────┐
  │ RabbitMQ │
  │ (5672)   │
  └────┬─────┘
       │
  ┌────▼──────────┬─────────────┐
  │ weather      │ alert        │
  │ (3005)       │ (3006)       │
  │ +recommend  │ (3007)       │
  │ (3007)       │              │
  └─────────────┴──────────────┘
```

### Eventos Asíncronos (RabbitMQ)

| Evento | Publicador | Suscriptor |
|--------|------------|------------|
| `user.registered` | auth-service | - |
| `parcela.created` | farm-service | - |
| `cultivo.created` | crop-service | - |
| `actividad.created` | activity-service | recommendation-service |
| `weather.updated` | weather-service | alert-service, recommendation-service |
| `alerta.creada` | alert-service | notification-service |
| `recommendation.creada` | recommendation-service | notification-service |

### Construir y Desplegar

```bash
# Construir todos los servicios
for dir in */; do
  cd "$dir"
  npm install && npm run build
  cd ..
done

# O usar docker-compose
docker-compose build
docker-compose up -d
```

### Acceso a Servicios

- **Frontend**: http://localhost:8000
- **RabbitMQ UI**: http://localhost:15672 (guest/guest)
- **Health Check**: http://localhost:8000/health