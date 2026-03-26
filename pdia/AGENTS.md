# AGENTS.md — Plataforma Digital de Agricultura Inteligente (PDIA)

> Este archivo provee contexto completo al agente de IA para entender el proyecto, sus decisiones técnicas, reglas de código y estructura esperada.

---

## 1. Descripción General del Proyecto

La **PDIA** es una plataforma web (PWA) para pequeños productores agrícolas del departamento del Magdalena, Colombia. Permite registrar cultivos y parcelas, consultar información climática en tiempo real y recibir alertas y recomendaciones agrícolas automáticas.

**Contexto crítico:**

- Usuarios principales: productores rurales con celulares Android de gama baja
- Conectividad intermitente — el sistema DEBE funcionar offline
- Interfaz mobile-first, lenguaje simple, íconos grandes
- El sistema es una herramienta de apoyo, NO sustituye el criterio del productor

---

## 2. Stack Tecnológico — Decisiones Fijas

> No sugerir cambios de tecnología. Estas decisiones están justificadas y documentadas.

### Entregable 2 — Prototipo inicial (actual)

| Capa            | Tecnología                        | Nota                                              |
| --------------- | --------------------------------- | ------------------------------------------------- |
| Frontend        | React + Tailwind CSS + TypeScript | Framework permitido desde este entregable         |
| PWA             | Service Workers nativos           | —                                                 |
| Backend         | Node.js + Express + TypeScript    | **Sin NestJS** — Node.js es runtime, no framework |
| Base de datos   | PostgreSQL                        | 15+                                               |
| API climática   | Open-Meteo                        | Sin API key                                       |
| Deploy frontend | Vercel                            | Plan gratuito                                     |
| Deploy backend  | Railway                           | Plan gratuito                                     |
| BD en nube      | Neon                              | Plan gratuito                                     |

### Entregable Final — Producto completo

| Capa          | Tecnología                        | Nota                          |
| ------------- | --------------------------------- | ----------------------------- |
| Frontend      | React + Tailwind CSS + TypeScript | Igual                         |
| PWA           | Service Workers nativos           | Igual                         |
| Backend       | Node.js +**NestJS** + TypeScript  | NestJS se agrega en esta fase |
| ORM           | TypeORM                           | Mapeo con PostgreSQL          |
| Base de datos | PostgreSQL                        | Igual                         |
| API climática | Open-Meteo                        | Igual                         |

> **Regla crítica para el agente:** En el entregable 2 el backend NO usa NestJS. Usa Node.js con Express puro y TypeScript. NestJS se incorpora únicamente en el entregable final. El frontend SÍ usa React y Tailwind desde el entregable 2.

> **Aclaración de fase actual:** este entregable debe mantenerse en **TypeScript puro** (backend Express sin NestJS y frontend React + Vite sin Next.js). No introducir frameworks adicionales en esta fase.

**Paradigma obligatorio en todos los entregables: Orientado a Objetos.** Usar clases, interfaces, herencia y encapsulamiento en TypeScript tanto en backend como en frontend. Las entidades del dominio deben ser clases con sus atributos y métodos, no objetos planos.

---

## 3. Estructura de Carpetas Esperada

```
pdia/
├── frontend/                  # React PWA
│   ├── config/                # Configuración técnica (Vite, ESLint, tsconfig.app/node)
│   ├── src/
│   │   ├── features/          # Módulos funcionales por dominio
│   │   ├── shared/            # Recursos transversales reutilizables
│   │   ├── store/             # Estado global
│   │   ├── App.tsx            # Rutas principales
│   │   ├── main.tsx           # Punto de entrada
│   │   └── index.css          # Estilos base + Tailwind
│   ├── public/
│   │   └── service-worker.js  # Service worker para PWA offline
│   └── ...
│
├── backend/                   # Node.js + Express + TypeScript (entregable 2 — sin NestJS)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Autenticación JWT
│   │   │   ├── users/         # Gestión de usuarios
│   │   │   ├── parcelas/      # Gestión de parcelas
│   │   │   ├── cultivos/      # Gestión de cultivos
│   │   │   ├── actividades/   # Registro de actividades agrícolas
│   │   │   ├── clima/         # Integración Open-Meteo
│   │   │   ├── alertas/       # Generación de alertas automáticas
│   │   │   ├── recomendaciones/ # Motor de recomendaciones
│   │   │   ├── reportes/      # Generación y exportación
│   │   │   └── admin/         # Administración del sistema
│   │   ├── common/            # Guards, interceptors, decorators
│   │   ├── config/            # Configuración global
│   │   └── main.ts
│   └── ...
│
└── AGENTS.md                  # Este archivo
```

---

## 4. Actores del Sistema

| Actor              | Tipo              | Descripción                                                                               |
| ------------------ | ----------------- | ----------------------------------------------------------------------------------------- |
| Productor Agrícola | Humano principal  | Registra parcelas, cultivos y actividades. Recibe alertas y recomendaciones               |
| Operario           | Humano secundario | Asignado por el productor a una parcela. Solo puede registrar actividades agrícolas       |
| Técnico Agrónomo   | Humano secundario | Consulta cultivos asignados, historial y recomendaciones. Registra observaciones técnicas |
| Administrador      | Humano secundario | Gestiona usuarios, configura parámetros de alertas, consulta logs                         |
| API Open-Meteo     | Sistema externo   | Provee datos climáticos por coordenadas geográficas. Se consulta cada hora                |

---

## 5. Módulos y Requisitos Funcionales Clave

### Módulo Auth (RF01–RF05, RF51, RF52, RF69)

- Registro de productores con nombre, identificación, email y contraseña
- Login con email y contraseña para todos los roles
- Recuperación de contraseña por email
- Cierre de sesión seguro
- Bloqueo tras 5 intentos fallidos
- El Operario inicia sesión igual que los demás usuarios

### Módulo Parcelas (RF53–RF56, RF66–RF68, RF71)

- CRUD completo de parcelas: nombre, municipio, hectáreas, coordenadas geográficas
- El productor puede asignar y desasignar operarios a parcelas
- El productor ve lista de sus operarios y sus parcelas asignadas

### Módulo Cultivos (RF06–RF10, RF39–RF40)

- CRUD de cultivos asociados a una parcela
- Estados: en crecimiento, cosechado, afectado
- Listar, buscar por tipo y consultar detalle

### Módulo Actividades (RF11–RF17, RF45–RF47, RF59–RF60)

- Registro de: observaciones, riego, fertilización, control de plagas
- Lo hacen Productor Y Operario (en parcelas asignadas)
- Funciona OFFLINE — almacenamiento local + sincronización automática
- Mostrar indicador visual cuando está offline

### 8Módulo Clima (RF18–RF23)

- Consulta Open-Meteo con coordenadas de la parcela
- Muestra: temperatura, humedad, lluvia, viento
- Pronóstico 5 días
- Actualización automática cada hora

### Módulo Alertas (RF24, RF26–RF29, RF57)

- Generación AUTOMÁTICA del sistema, no la inicia el usuario
- Triggers: lluvia > 70%, temperatura fuera de rango configurado, viento > 50 km/h
- Cada alerta se registra con fecha, tipo y valor detectado

### Módulo Recomendaciones (RF30–RF34, RF58)

- Generación AUTOMÁTICA basada en datos climáticos y tipo de cultivo
- Riego: basado en temperatura actual y probabilidad de lluvia
- Fertilización: basado en tipo de cultivo
- Fitosanitaria: se genera cuando el productor registra detección de plaga
- Cada recomendación se registra con fecha, tipo y cultivo asociado

### Módulo Reportes (RF41–RF44)

- Reporte de actividades, riegos y fertilizaciones por cultivo
- Exportación en PDF y CSV

### Módulo Admin (RF48–RF50, RF61)

- Gestión de usuarios
- Configurar límites de temperatura y lluvia por tipo de cultivo
- Ver logs de actividad y estadísticas generales

\***\*Requerimentos funcionales\*\***

Deben cumplirse todos estos requerimentos a la hora de entregar el proyecto al final

**3.1** \***\*Requisitos funcionales\*\***

Los requisitos
funcionales se presentan a continuación:

**RF01.**
El sistema debe permitir registrar productores agrícolas solicitando nombre
completo, número de identificación, correo electrónico y contraseña.

**RF02.**
El sistema debe validar que el correo electrónico registrado no exista
previamente en la plataforma.

**RF03.**
El sistema debe permitir a los usuarios iniciar sesión utilizando correo
electrónico y contraseña.

**RF04.**
El sistema debe permitir recuperar la contraseña enviando un enlace de
recuperación al correo electrónico registrado.

**RF05.**
El sistema debe permitir a los usuarios actualizar su nombre completo, correo
electrónico y contraseña.

**RF06.**
El sistema debe permitir registrar un cultivo indicando tipo de cultivo, fecha
de siembra, estado inicial del cultivo y observaciones del productor.

**RF07.**
El sistema debe permitir seleccionar el estado del cultivo entre las opciones:
en crecimiento, cosechado o afectado.

**RF08.**
El sistema debe permitir modificar el tipo de cultivo, la fecha de siembra, el
estado del cultivo y las observaciones registradas.

**RF09.**
El sistema debe permitir eliminar un cultivo registrado junto con sus
observaciones, actividades agrícolas, alertas y recomendaciones asociadas.

**RF10. **El
sistema debe mostrar una lista de los cultivos registrados por el productor
indicando tipo de cultivo, fecha de siembra y estado actual.

**RF11.**
El sistema debe permitir registrar observaciones del cultivo indicando fecha
del registro y descripción de la observación.

**RF12. **El
sistema debe permitir registrar actividades de riego indicando fecha del riego,
cantidad aproximada de agua utilizada y observaciones.

**RF13.**
El sistema debe permitir registrar aplicaciones de fertilizantes indicando tipo
de fertilizante, fecha de aplicación y observaciones.

**RF14.**
El sistema debe permitir registrar actividades de control de plagas indicando
fecha de detección, tipo de plaga y acción aplicada.

**RF15.**
El sistema debe mostrar el historial de actividades registradas para un cultivo
específico.

**RF16.**
El sistema debe mostrar las actividades del cultivo ordenadas cronológicamente
por fecha.

**RF17.**
El sistema debe permitir filtrar las actividades del cultivo por tipo de
actividad (riego, fertilización, control de plagas u observaciones).

**RF18.**
El sistema debe mostrar la temperatura actual de la zona del cultivo obtenida
desde un servicio externo de datos meteorológicos.

**RF19.**
El sistema debe mostrar la humedad relativa actual de la zona del cultivo
obtenida desde un servicio externo de datos meteorológicos.

**RF20.**
El sistema debe mostrar la probabilidad de lluvia para la zona del cultivo.

**RF21** .
El sistema debe mostrar la velocidad del viento registrada para la zona del
cultivo.

**RF22.**
El sistema debe mostrar el pronóstico climático para los próximos cinco días
incluyendo temperatura y probabilidad de lluvia.

**RF23.**
El sistema debe actualizar automáticamente los datos climáticos utilizando un
servicio externo de información meteorológica.

**RF24.** El
sistema debe generar una alerta cuando la probabilidad de lluvia sea superior
al 70% para la zona del cultivo.

**RF26.**
El sistema debe generar una alerta cuando la temperatura registrada supere el
límite máximo configurado para el cultivo.

**RF27.**
El sistema debe generar una alerta cuando la temperatura registrada sea
inferior al límite mínimo configurado para el cultivo.

**RF28.**
El sistema debe registrar cada alerta generada indicando fecha, tipo de alerta
y valor de la condición climática detectada.

**RF29.**
El sistema debe permitir consultar el historial de alertas climáticas
generadas.

**RF30.**
El sistema debe generar recomendaciones de riego basadas en la temperatura
actual y la probabilidad de lluvia.

**RF31.**
El sistema debe generar recomendaciones de fertilización basadas en el tipo de
cultivo registrado.

**RF32.**
El sistema debe mostrar las recomendaciones agrícolas en la vista del cultivo
correspondiente.

**RF33.**
El sistema debe registrar cada recomendación generada indicando fecha, tipo de
recomendación y cultivo asociado.

**RF34.**
El sistema debe permitir consultar el historial de recomendaciones generadas
para cada cultivo.

**RF35.**
El sistema debe generar notificaciones cuando se detecte una nueva alerta
climática.

**RF36.**
El sistema debe generar notificaciones cuando el sistema emita una nueva
recomendación agrícola.

**RF37.**
El sistema debe mostrar las notificaciones en una sección de notificaciones del
usuario.

**RF38.**
El sistema debe permitir consultar el historial de notificaciones recibidas.

**RF39.**
El sistema debe permitir buscar cultivos registrados utilizando el tipo de
cultivo.

**RF40.**
El sistema debe mostrar los resultados de la búsqueda de cultivos indicando
tipo de cultivo, fecha de siembra y estado.

**RF41.**
El sistema debe permitir generar un reporte de actividades agrícolas
registradas para un cultivo específico.

**RF42.**
El sistema debe permitir generar un reporte de riegos realizados indicando
fecha y cantidad de agua utilizada.

**RF43.**
El sistema debe permitir generar un reporte de fertilizaciones realizadas
indicando tipo de fertilizante y fecha de aplicación.

**RF44.**
El sistema debe permitir exportar los reportes generados en formato PDF o CSV.

**RF45.**
El sistema debe permitir registrar actividades agrícolas cuando el dispositivo
no tenga conexión a internet.

**RF46.**
El sistema debe almacenar localmente los registros realizados en modo offline.

**RF47.**
El sistema debe sincronizar automáticamente los registros almacenados cuando se
restablezca la conexión a internet.

**RF48.**
El sistema debe registrar las acciones realizadas por los usuarios indicando
usuario, fecha y tipo de acción realizada.

**RF49.**
El sistema debe permitir al administrador visualizar el registro de actividades
realizadas en el sistema.

**RF50.**
El sistema debe mostrar estadísticas del sistema incluyendo número total de
cultivos registrados y número total de actividades agrícolas registradas.

**RF51.**
El sistema debe permitir cerrar sesión de forma segura eliminando la sesión
activa del usuario.

**RF52.**
El sistema debe bloquear temporalmente el acceso tras cinco intentos fallidos
consecutivos de inicio de sesión.

**RF53.**
El sistema debe permitir registrar una parcela indicando nombre de la parcela,
municipio, extensión en hectáreas y coordenadas geográficas.

**RF54.**
El sistema debe permitir modificar la información registrada de una parcela.

**RF55.**
El sistema debe permitir eliminar una parcela junto con los cultivos asociados
a ella.

**RF56.**
El sistema debe mostrar la lista de parcelas registradas por el productor
indicando nombre, municipio y extensión en hectáreas.

**RF57.**
El sistema debe generar una alerta cuando la velocidad del viento supere los 50
km/h en la zona del cultivo.

**RF58.**
El sistema debe generar recomendaciones de control fitosanitario cuando el
productor registre una actividad de detección de plaga en su cultivo.

**RF59.**
El sistema debe mostrar un indicador visual en la interfaz cuando el
dispositivo esté operando en modo offline.

**RF60.**
El sistema debe garantizar que los datos registrados en modo offline no se
pierdan ante un cierre inesperado de la aplicación.

**RF61.**
El sistema debe permitir al administrador configurar los límites de temperatura
máxima, temperatura mínima y probabilidad de lluvia que activan las alertas por
tipo de cultivo.

**RF62.**
El sistema debe permitir al técnico agrónomo consultar la lista de cultivos
registrados por los productores asignados a su zona.

**RF63.**
El sistema debe permitir al técnico agrónomo consultar el historial de
actividades agrícolas registradas por un productor específico.

**RF64.**
El sistema debe permitir al técnico agrónomo registrar observaciones técnicas
sobre el estado de un cultivo consultado.

**RF65.**
El sistema debe permitir al técnico agrónomo consultar las recomendaciones
generadas para los cultivos de los productores asignados.

**RF66.**
El sistema debe permitir al productor registrar un operario indicando nombre
completo, número de identificación, correo electrónico y contraseña.

**RF67.**
El sistema debe permitir al productor asignar un operario registrado a una
parcela específica.

**RF68.**
El sistema debe permitir al productor desasignar un operario de una parcela.

**RF69.**
El sistema debe permitir al operario iniciar sesión utilizando correo
electrónico y contraseña.

**RF70.**
El sistema debe mostrar al operario únicamente las parcelas y cultivos que le
han sido asignados por el productor.

**RF71.**
El sistema debe permitir al productor consultar la lista de operarios
registrados y sus parcelas asignadas.

---

## 6. Modelo de Dominio — Entidades Principales

```
Usuario
  ├── id, nombre, identificacion, email, password, rol
  └── rol: PRODUCTOR | OPERARIO | TECNICO | ADMINISTRADOR

Parcela
  ├── id, nombre, municipio, hectareas, latitud, longitud
  └── pertenece a: Productor (Usuario)

AsignacionOperario
  ├── operario: Usuario (rol OPERARIO)
  └── parcela: Parcela

Cultivo
  ├── id, tipoCultivo, fechaSiembra, estado, observaciones
  └── pertenece a: Parcela
  └── estado: EN_CRECIMIENTO | COSECHADO | AFECTADO

ActividadAgricola
  ├── id, tipo, fecha, descripcion, datos adicionales según tipo
  ├── tipo: RIEGO | FERTILIZACION | PLAGA | OBSERVACION
  └── pertenece a: Cultivo, registrado por: Usuario

DatoClimatico
  ├── id, temperatura, humedad, probabilidadLluvia, viento, fecha
  └── pertenece a: Parcela

Alerta
  ├── id, tipo, valorDetectado, fecha
  └── pertenece a: Cultivo

Recomendacion
  ├── id, tipo, descripcion, fecha
  └── pertenece a: Cultivo
```

---

## 7. Reglas de Negocio Críticas

- Un cultivo SIEMPRE pertenece a una parcela. No puede existir cultivo sin parcela.
- Un Operario SOLO puede ver y registrar actividades en parcelas que le fueron asignadas por el productor.
- Las alertas y recomendaciones las genera el SISTEMA automáticamente, nunca un usuario.
- Las recomendaciones deben presentarse como sugerencias, nunca como órdenes absolutas.
- Los datos del productor son privados y no se comparten sin autorización explícita.
- El sistema NO debe hacer recomendaciones que violen regulaciones del ICA Colombia.

---

## 8. Integración Open-Meteo

```typescript
// Ejemplo de consulta — sin API key requerida
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FBogota&forecast_days=5`;
```

Variables que se usan:

- `current.temperature_2m` — temperatura actual
- `current.relative_humidity_2m` — humedad relativa
- `current.precipitation_probability` — probabilidad de lluvia
- `current.wind_speed_10m` — velocidad del viento
- `daily` — pronóstico 5 días

---

## 9. Lógica de Alertas — Umbrales por Defecto

Estos valores son configurables por el Administrador (RF61):

| Condición              | Umbral                           | Acción                   |
| ---------------------- | -------------------------------- | ------------------------ |
| Probabilidad de lluvia | > 70%                            | Generar alerta de lluvia |
| Temperatura máxima     | Configurable por tipo de cultivo | Generar alerta de calor  |
| Temperatura mínima     | Configurable por tipo de cultivo | Generar alerta de frío   |
| Velocidad del viento   | > 50 km/h                        | Generar alerta de viento |

---

## 10. Estrategia Offline (PWA)

El sistema debe funcionar sin conexión para el registro de actividades agrícolas:

1. Service Worker cachea la app en la primera carga
2. Cuando no hay conexión, los registros se guardan en IndexedDB local
3. Se muestra indicador visual de modo offline en la interfaz
4. Al recuperar conexión, se sincroniza automáticamente con el backend
5. Los datos offline NO se pierden ante cierre inesperado de la app

---

## 11. Atributos de Calidad — Métricas Objetivo

| Atributo       | Métrica                                                       |
| -------------- | ------------------------------------------------------------- |
| Disponibilidad | 99% entre 6am y 10pm                                          |
| Rendimiento    | Respuesta máx 3 segundos en 3G                                |
| Seguridad      | Bloqueo en 5 intentos fallidos, contraseñas con bcrypt, HTTPS |
| Usabilidad     | Registro de cultivo completable en < 5 minutos sin asistencia |
| Offline        | Cero pérdida de datos, sincronización < 30 segundos           |
| Escalabilidad  | Soportar 500 usuarios sin degradación                         |
| Compatibilidad | Android Chrome, pantallas desde 360px                         |

---

## 12. Convenciones de Código

- Todo en **TypeScript estricto** — no usar `any`
- Clases para entidades del dominio, interfaces para contratos
- Nombres en **inglés** para código, español solo en mensajes al usuario
- Variables de entorno en `.env` — nunca credenciales en código

### Estructura de datos personalizada obligatoria (ListaP)

- El proyecto adopta `ListaP` como estructura de datos personalizada base (lista doblemente enlazada).
- Ubicación oficial backend: `backend/src/utilidades/ListaP.ts`.
- No reemplazar `ListaP` por implementaciones nativas equivalentes cuando el requerimiento académico sea demostrar estructura creada por el equipo.
- `ListaP` debe ser genérica (`ListaP<T>`) para poder reutilizarse en cualquier módulo.
- Métodos base soportados: `push`, `unshift`, `pop`, `shift`, `insertAt`, `deleteAt`, `get`, `search`, `traverse`, `reverseTraverse`, `size`, `isEmpty`, `clear`, `print`.
- Si en el futuro se requieren operaciones avanzadas, extender `ListaP` con nuevos métodos manteniendo compatibilidad hacia atrás.

Ejemplo de uso:

```typescript
import { ListaP } from "./src/utilidades/ListaP";

const lista = new ListaP<number>();
lista.push(10);
lista.push(20);
lista.unshift(5);

const datos = lista.traverse(); // [5, 10, 20]
```

### Backend entregable 2 — Express puro

- Cada módulo tiene: `controller.ts`, `service.ts`, `model.ts`, `routes.ts`
- Las clases del dominio van en `src/models/` con sus atributos y métodos
- Los controladores solo reciben y responden, la lógica va en services
- Middlewares para autenticación y manejo de errores en `src/common/`

### Backend entregable final — NestJS

- Cada módulo tiene: `module.ts`, `controller.ts`, `service.ts`, `entity.ts`, `dto.ts`
- DTOs para todas las entradas de la API
- Guards para proteger rutas según rol
- Decoradores y módulos de NestJS correctamente aplicados

---

## 13. Variables de Entorno Requeridas

```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRATION=7d
PORT=3000

# Frontend
VITE_API_URL=http://localhost:3000
```

---

## 14. Contexto del Proyecto Académico

- Universidad: UNIMAGDALENA — Ingeniería de Sistemas
- Curso: Arquitectura de Software — Proyecto Capstone
- Evaluación: Acreditación ABET SO2
- Metodología: RUP (Rational Unified Process)
- Equipo: Darwin Alvarez (Líder/Arquitecto), Camilo Monsalve (Analista), Wilson Ali (Calidad/Datos)
- Duración: 4 meses — 16 semanas
- Entrega final: Junio 2025

> **Importante para el agente:** Este proyecto se evalúa académicamente. Las decisiones arquitectónicas deben ser coherentes, justificables y trazables. Cada módulo debe reflejar el paradigma orientado a objetos. No simplificar a costa de romper la arquitectura definida.
