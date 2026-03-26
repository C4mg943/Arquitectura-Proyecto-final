# GUÍA COMPLETA DEL PROYECTO — PDIA
## Plataforma Digital de Agricultura Inteligente

> Documento de referencia para el equipo de desarrollo.
> Aquí está todo lo que necesitas saber para trabajar en el proyecto.

---

## 1. RESUMEN DEL PROYECTO

La PDIA es una plataforma web tipo PWA (Progressive Web App) para pequeños productores agrícolas del departamento del Magdalena, Colombia. Permite registrar cultivos y parcelas, consultar clima en tiempo real y recibir alertas y recomendaciones agrícolas automáticas.

**Lo más importante:**
- Usuarios principales usan celulares Android de gama baja
- Funciona sin internet (modo offline)
- Interfaz simple, íconos grandes, lenguaje claro
- El sistema sugiere, no decide — el productor siempre tiene la última palabra

---

## 2. STACK TECNOLÓGICO

### Entregable 2 — Prototipo (AHORA)

| Qué | Tecnología | Dónde corre |
|---|---|---|
| Frontend | React + TypeScript + Tailwind CSS | http://localhost:5173 |
| Backend | Node.js + Express + TypeScript | http://localhost:3000 |
| Base de datos | PostgreSQL | Local o Neon (nube gratis) |
| API climática | Open-Meteo | Externa, sin API key |

### Entregable Final

| Qué | Tecnología |
|---|---|
| Frontend | Igual |
| Backend | Node.js + **NestJS** + TypeScript |
| ORM | TypeORM |
| Base de datos | PostgreSQL en Neon |

> **Regla crítica:** En el entregable 2 el backend NO usa NestJS.
> Node.js es el runtime (no un framework). Express es el servidor HTTP.
> NestJS entra solo en el entregable final.

> **Aclaración de fase actual:** Este entregable se mantiene en **TypeScript puro**.
> - Backend: Node.js + Express + TypeScript (sin NestJS)
> - Frontend: React + Vite + TypeScript (sin Next.js)

---

## 3. ESTRUCTURA COMPLETA DEL PROYECTO

```
pdia/
├── frontend/                  ← React PWA
├── backend/                   ← Node.js + Express
├── AGENTS.md                  ← Contexto para agentes de IA
├── GUIA_PROYECTO.md           ← Este archivo
├── README.md
└── .gitignore
```

---

## 4. BACKEND — Todo lo que necesitas saber

### 4.1 Tecnologías instaladas

```json
````de`pendencias:
  express         → servidor HTTP
  cors            → permitir peticiones desde el frontend
  dotenv          → leer variables de entorno del .env
  pg              → conectar con PostgreSQL
  bcryptjs        → cifrar contraseñas
  jsonwebtoken    → generar y verificar tokens JWT

devDependencias:
  typescript      → lenguaje
  ts-node         → ejecutar TypeScript directo sin compilar
  nodemon         → reiniciar servidor automáticamente al guardar
  @types/*        → tipos para cada```` librería`
```

### 4.2 Cómo ejecutar el backend

```bash
# Entrar a la carpeta
cd pdia/backend

# Instalar dependencias (solo la primera vez)
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Nodemon queda escuchando. Cada vez que guardes un archivo `.ts` reinicia solo.
El servidor corre en **http://localhost:3000**

### 4.3 Variables de entorno — archivo .env

Crear el archivo `.env` en la raíz de `backend/` con este contenido:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/pdia
JWT_SECRET=pdia_secret_key_2025
JWT_EXPIRATION=7d
```

> NUNCA subir el .env a GitHub. Ya está en el .gitignore.

### 4.4 Arquitectura en capas — DAO

El backend sigue arquitectura en capas con patrón DAO (Data Access Object).

```
Petición HTTP
     ↓
  rutas/          → define las URLs y métodos HTTP
     ↓
  controladores/  → recibe req y res, llama al servicio
     ↓
  servicios/      → lógica de negocio, validaciones
     ↓
  dao/            → acceso a datos, queries SQL con pg
     ↓
  PostgreSQL
```

Los **modelos** son las clases del dominio. Las usan todas las capas.

### 4.5 Estructura de carpetas del backend

```
src
├── app
│   └── finca
│       ├── controller
│       ├── model
│       │   └── dto
│       ├── repository
│       ├── route
│       └── service
├── config
│   ├── api
│   │   └── Servidor.ts
│   ├── connection
│   │   ├── camelCase.ts
│   │   ├── dbConnetions.ts
│   │   └── optionsPG.ts
│   ├── domain
│   └── test
├── external_files
├── index.ts
└── middleware

```

### 4.6 Qué va en cada archivo — ejemplos

**modelos/Usuario.ts** — clase con atributos privados y métodos
```typescript
class Usuario {
  private id: number
  private nombre: string
  private email: string
  private rol: Rol

  constructor(id: number, nombre: string, email: string, rol: Rol) {
    this.id = id
    this.nombre = nombre
    this.email = email
    this.rol = rol
  }

  getId(): number { return this.id }
  getNombre(): string { return this.nombre }
  getEmail(): string { return this.email }
  getRol(): Rol { return this.rol }
}

enum Rol {
  PRODUCTOR = 'PRODUCTOR',
  OPERARIO = 'OPERARIO',
  TECNICO = 'TECNICO',
  ADMINISTRADOR = 'ADMINISTRADOR'
}
```

**dao/UsuarioDAO.ts** — queries SQL directos con pg
```typescript
interface IUsuarioDAO {
  crear(usuario: NuevoUsuario): Promise<Usuario>
  buscarPorEmail(email: string): Promise<Usuario | null>
  buscarPorId(id: number): Promise<Usuario | null>
}

class UsuarioDAO implements IUsuarioDAO {
  async crear(datos: NuevoUsuario): Promise<Usuario> {
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1,$2,$3,$4) RETURNING *',
      [datos.nombre, datos.email, datos.password, datos.rol]
    )
    return resultado.rows[0]
  }
  // ...
}
```

**servicios/AutenticacionServicio.ts** — lógica de negocio
```typescript
class AutenticacionServicio {
  private usuarioDAO: UsuarioDAO

  constructor() {
    this.usuarioDAO = new UsuarioDAO()
  }

  async registrar(datos: NuevoUsuario): Promise<string> {
    const existe = await this.usuarioDAO.buscarPorEmail(datos.email)
    if (existe) throw new Error('El correo ya está registrado')
    datos.password = await cifrarPassword(datos.password)
    const usuario = await this.usuarioDAO.crear(datos)
    return generarToken(usuario)
  }
}
```

**controladores/AutenticacionControlador.ts** — solo HTTP
```typescript
class AutenticacionControlador {
  private servicio: AutenticacionServicio

  constructor() {
    this.servicio = new AutenticacionServicio()
  }

  async registrar(req: Request, res: Response): Promise<void> {
    try {
      const token = await this.servicio.registrar(req.body)
      res.status(201).json({ token })
    } catch (error) {
      res.status(400).json({ mensaje: error.message })
    }
  }
}
```

**rutas/autenticacion.ts** — solo URLs
```typescript
const router = Router()
const controlador = new AutenticacionControlador()

router.post('/registro', (req, res) => controlador.registrar(req, res))
router.post('/login', (req, res) => controlador.iniciarSesion(req, res))

export default router
```

### 4.7 Endpoints de la API

| Método | URL | Descripción | Autenticación |
|---|---|---|---|
| POST | /api/auth/registro | Registrar productor | No |
| POST | /api/auth/login | Iniciar sesión | No |
| POST | /api/auth/recuperar | Recuperar contraseña | No |
| GET | /api/parcelas | Listar mis parcelas | Sí |
| POST | /api/parcelas | Crear parcela | Sí |
| PUT | /api/parcelas/:id | Modificar parcela | Sí |
| DELETE | /api/parcelas/:id | Eliminar parcela | Sí |
| GET | /api/cultivos | Listar cultivos | Sí |
| POST | /api/cultivos | Crear cultivo | Sí |
| PUT | /api/cultivos/:id | Modificar cultivo | Sí |
| DELETE | /api/cultivos/:id | Eliminar cultivo | Sí |
| GET | /api/actividades/:cultivoId | Historial actividades | Sí |
| POST | /api/actividades | Registrar actividad | Sí |
| GET | /api/clima/:parcelaId | Clima actual | Sí |
| GET | /api/alertas/:cultivoId | Alertas del cultivo | Sí |
| GET | /api/recomendaciones/:cultivoId | Recomendaciones | Sí |
| GET | /api/reportes/:cultivoId | Generar reporte | Sí |

---

## 5. FRONTEND — Todo lo que necesitas saber

### 5.1 Tecnologías instaladas

```
react           → biblioteca de interfaces
typescript      → tipado estático
tailwind css    → estilos utility-first
vite            → bundler y servidor de desarrollo
react-router-dom → navegación entre páginas
zustand         → estado global ligero
zod             → validación de esquemas en frontend
```

### 5.1.1 Dependencias opcionales agregadas y para qué sirven

- **zustand**: manejo de estado global simple y escalable (ej. sesión de usuario)
- **zod**: validación tipada de formularios y payloads en cliente

En backend también se agregaron:
- **morgan**: logging HTTP de requests/responses para depuración
- **helmet**: hardening de cabeceras HTTP para seguridad base

### 5.2 Cómo ejecutar el frontend

```bash
# Entrar a la carpeta
cd pdia/frontend

# Instalar dependencias (solo la primera vez)
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Corre en **http://localhost:5173**

### 5.3 Tailwind v4 — cómo se usa

La instalación usa Tailwind v4. La configuración es más simple:

En `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

En `src/index.css` solo esta línea arriba:
```css
@import "tailwindcss";
```

No hay `tailwind.config.js`. Se aplican clases directamente en JSX:
```tsx
<button className="bg-green-600 text-white px-4 py-2 rounded-lg">
  Guardar
</button>
```

### 5.4 Estructura de carpetas del frontend (actualizada)

```
config
├── eslint.config.js
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
src
├── App.tsx
├── assets
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── features
│   ├── activities
│   │   └── pages
│   │       └── ActivitiesPage.tsx
│   ├── alerts
│   │   └── pages
│   │       └── AlertsPage.tsx
│   ├── auth
│   │   └── pages
│   │       ├── LoginPage.tsx
│   │       └── RegisterPage.tsx
│   ├── crops
│   │   └── pages
│   │       └── CropsPage.tsx
│   ├── dashboard
│   │   └── pages
│   │       └── DashboardPage.tsx
│   ├── not-found
│   │   └── pages
│   │       └── NotFoundPage.tsx
│   ├── parcels
│   │   └── pages
│   │       └── ParcelsPage.tsx
│   ├── reports
│   │   └── pages
│   │       └── ReportsPage.tsx
│   └── weather
│       └── pages
│           └── WeatherPage.tsx
├── index.css
├── main.tsx
├── shared
│   ├── components
│   │   └── common
│   │       ├── ActivityForm.tsx
│   │       ├── CropForm.tsx
│   │       └── ParcelForm.tsx
│   ├── hooks
│   │   └── useOffline.ts
│   ├── models
│   │   ├── Activity.ts
│   │   ├── Crop.ts
│   │   ├── Parcel.ts
│   │   └── User.ts
│   ├── services
│   │   └── apiClient.ts
│   └── utils
│       └── validators.ts
└── store
    └── authStore.ts
```

### 5.5 Qué va en cada carpeta — ejemplos (estructura nueva)

**shared/models/Parcel.ts** — interfaces TypeScript
```typescript
export interface Parcel {
  id: number
  nombre: string
  municipio: string
  hectareas: number
  latitud: number
  longitud: number
}

export interface NewParcel {
  nombre: string
  municipio: string
  hectareas: number
  latitud: number
  longitud: number
}
```

**shared/services/apiClient.ts** — URL base de API
```typescript
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
```

**shared/utils/validators.ts** — validaciones con Zod
```tsx
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
```

**store/authStore.ts** — estado global con Zustand
```typescript
import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}))
```

### 5.6 Variable de entorno del frontend

Crear `.env` en la raíz de `frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

---

## 6. CONEXIÓN FRONTEND ↔ BACKEND

```
Frontend (React)          Backend (Express)         Base de datos
localhost:5173    →  →    localhost:3000      →  →   PostgreSQL
                          /api/parcelas
                          /api/cultivos
                          /api/auth/login
                          etc.
```

El frontend hace peticiones `fetch` al backend. El backend responde JSON. El backend consulta PostgreSQL.

**El token JWT** es el mecanismo de autenticación:
1. Usuario hace login → backend genera token → frontend lo guarda en localStorage
2. En cada petición → frontend envía token en el header `Authorization: Bearer <token>`
3. Middleware del backend → verifica el token → permite o rechaza la petición

---

## 7. INTEGRACIÓN CON OPEN-METEO

La API climática no requiere registro ni API key. Se consulta directo desde el backend:

```typescript
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FBogota&forecast_days=5`

const respuesta = await fetch(url)
const datos = await respuesta.json()
```

Variables útiles:
- `datos.current.temperature_2m` → temperatura actual
- `datos.current.relative_humidity_2m` → humedad
- `datos.current.precipitation_probability` → probabilidad de lluvia
- `datos.current.wind_speed_10m` → viento en km/h
- `datos.daily` → pronóstico 5 días

---

## 8. MODO OFFLINE — PWA

El sistema debe funcionar sin internet para registrar actividades:

1. **Service Worker** cachea la app en la primera carga
2. Sin conexión → datos se guardan en **IndexedDB** del navegador
3. Indicador visual en la interfaz cuando está offline
4. Al recuperar conexión → sincronización automática con el backend
5. Datos offline nunca se pierden aunque se cierre la app

Hook para detectar estado de conexión:
```typescript
const useOffline = () => {
  const [estaOffline, setEstaOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const manejarOffline = () => setEstaOffline(true)
    const manejarOnline = () => setEstaOffline(false)

    window.addEventListener('offline', manejarOffline)
    window.addEventListener('online', manejarOnline)

    return () => {
      window.removeEventListener('offline', manejarOffline)
      window.removeEventListener('online', manejarOnline)
    }
  }, [])

  return estaOffline
}
```

---

## 9. COMANDOS RÁPIDOS DE REFERENCIA

```bash
# Correr backend
cd pdia/backend && npm run dev

# Correr frontend
cd pdia/frontend && npm run dev

# Instalar dependencia en backend
cd pdia/backend && npm install <paquete>

# Instalar dependencia en frontend
cd pdia/frontend && npm install <paquete>

# Compilar backend para producción
cd pdia/backend && npm run build
```

---

## 10. REGLAS DEL PROYECTO — NO OLVIDAR

- Todo el código en **TypeScript estricto** — no usar `any`
- Nombres de carpetas y archivos en **inglés** (`features`, `shared`, `store`, etc)
- Mensajes visibles al usuario en **español**
- Variables y funciones según contexto, priorizando consistencia del módulo
- Clases para modelos del dominio — **no objetos planos**
- Interfaces para contratos entre capas
- El backend sigue estrictamente la arquitectura **Rutas → Controladores → Servicios → DAO**
- **Sin NestJS** en el entregable 2 — solo Express
- **Sin Next.js** en el entregable 2 — React + Vite
- El frontend siempre verifica si hay token antes de hacer peticiones protegidas
- Nunca subir `.env` a GitHub
- Cada commit debe tener un mensaje descriptivo en español

---

## 11. EQUIPO Y RESPONSABILIDADES

| Integrante | Rol | Responsable de |
|---|---|---|
| Darwin Alvarez | Líder técnico / Arquitecto | Backend, arquitectura, decisiones técnicas |
| Camilo Monsalve | Analista / Frontend | Páginas React, componentes, diseño |
| Wilson Ali | Calidad / Datos | Modelos, DAO, base de datos, pruebas |

---

## 12. CONTEXTO ACADÉMICO

- Universidad: UNIMAGDALENA — Ingeniería de Sistemas
- Curso: Arquitectura de Software — Proyecto Capstone
- Evaluación: Acreditación ABET SO2
- Metodología: RUP
- Duración: 4 meses — 16 semanas
- Segundo entregable: Diseño arquitectónico + prototipo inicial
- Entrega final: Junio 2025
