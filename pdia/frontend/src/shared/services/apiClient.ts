import { useAuthStore} from '../../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL

// --- Interfaces Esenciales ---

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data?: T
  details?: unknown
}

export interface FincaDto {
  id: number
  nombre: string
  municipio: string
  departamento: string
  productorId: number
  areaHectareas: number
  codigoIca: string
  createdAt: string | Date
}

// --- Manejo de Errores ---

export class ApiClientError extends Error {
  public readonly status: number
  public readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
    this.name = 'ApiClientError'
  }
}

// --- Utilidades Internas ---

function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function createHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders)
  headers.set('Bypass-Tunnel-Reminder', 'true')

  const token = useAuthStore.getState().token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = createHeaders(init.headers)

  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${withLeadingSlash(path)}`, {
    ...init,
    headers,
  })

  // Redirección si el token expira
  if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    useAuthStore.getState().clear()
    window.location.replace('/login')
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as ApiEnvelope<T>
    if (!response.ok || !payload.success) {
      throw new ApiClientError(payload.message || 'Error en la solicitud', response.status, payload.details)
    }
    return payload.data as T
  }

  if (!response.ok) {
    const text = await response.text()
    throw new ApiClientError(text || 'Error en el servidor', response.status)
  }

  return {} as T
}

// --- Cliente de API (Solo Fincas) ---

export const apiClient = {
  fincas: {
    list: () => request<FincaDto[]>('/api/finca/'),

    create: (payload: Partial<FincaDto>) =>
        request<FincaDto>('/api/finca/', {
          method: 'POST',
          body: JSON.stringify(payload)
        }),

    update: (id: number, payload: Partial<FincaDto>) =>
        request<FincaDto>(`/api/finca/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        }),

    delete: (id: number) =>
        request<void>(`/api/finca/${id}`, { method: 'DELETE' }),
  },

  // Mantenemos esto para verificar salud del backend
  probarConexion: () => request<{ success: boolean; message: string }>('/')
}