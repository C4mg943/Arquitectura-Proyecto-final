import { useAuthStore, type AuthUser } from '../../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3123'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data?: T
  details?: unknown
}

export type CultivoEstado = 'EN_CRECIMIENTO' | 'COSECHADO' | 'AFECTADO'
export type ActivityType = 'RIEGO' | 'FERTILIZACION' | 'PLAGA' | 'OBSERVACION'
export type AlertType = 'LLUVIA' | 'TEMPERATURA_ALTA' | 'TEMPERATURA_BAJA' | 'VIENTO'
export type TipoFinca = 'AGRICOLA' | 'GANADERA' | 'MIXTA' | 'FORESTAL'

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface RegisterPayload {
  nombre: string
  identificacion: string
  email: string
  password: string
  rol?: AuthUser['rol']
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ForgotPasswordResponse {
  requestAccepted: boolean
  resetUrl?: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

export interface UpdateProfilePayload {
  nombre: string
  identificacion: string
  email: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ParcelaDto {
  id: number
  nombre: string
  municipio: string
  hectareas: number
  latitud: number
  longitud: number
  fincaId: number
}

export interface CreateParcelaPayload {
  nombre: string
  municipio: string
  hectareas: number
  latitud: number
  longitud: number
  fincaId: number
}

export interface UpdateParcelaPayload {
  nombre?: string
  municipio?: string
  hectareas?: number
  latitud?: number
  longitud?: number
  fincaId?: number
}

export interface FincaDto {
  id: number
  nombre: string
  ubicacion: string
  descripcion: string | null
  area: number
  tipoFinca: TipoFinca
  fechaRegistro: string
  codigoIcaInvima: string | null
  propietarioId: number
}

export interface CreateFincaPayload {
  nombre: string
  ubicacion: string
  descripcion?: string
  area: number
  tipoFinca: TipoFinca
  fechaRegistro?: string
  codigoIcaInvima?: string
}

export interface UpdateFincaPayload {
  nombre?: string
  ubicacion?: string
  descripcion?: string
  area?: number
  tipoFinca?: TipoFinca
  fechaRegistro?: string
  codigoIcaInvima?: string
}

export interface RegisterOperarioPayload {
  nombre: string
  identificacion: string
  email: string
  password: string
}

export interface AsignarOperarioPayload {
  operarioId: number
  parcelaId: number
}

export interface ParcelaAsignadaDto {
  id: number
  nombre: string
  municipio: string
  hectareas: number
  fincaId: number
}

export interface OperarioConParcelasDto {
  operario: AuthUser
  parcelas: ParcelaAsignadaDto[]
}

export interface AsignacionOperarioDto {
  id: number
  operarioId: number
  parcelaId: number
  asignadoPorId: number
  fechaAsignacion: string
}

export interface CultivoDto {
  id: number
  tipoCultivo: string
  fechaSiembra: string
  estado: CultivoEstado
  observaciones: string | null
  parcelaId: number
}

export interface CreateCultivoPayload {
  tipoCultivo: string
  fechaSiembra: string
  estado: CultivoEstado
  observaciones?: string
  parcelaId: number
}

export interface UpdateCultivoPayload {
  tipoCultivo?: string
  fechaSiembra?: string
  estado?: CultivoEstado
  observaciones?: string
}

export interface ActividadDto {
  id: number
  tipo: ActivityType
  fecha: string
  descripcion: string
  datos: Record<string, unknown> | null
  cultivoId: number
  creadoPorId: number
}

export interface CreateActividadPayload {
  tipo: ActivityType
  fecha: string
  descripcion: string
  datos?: Record<string, unknown>
  cultivoId: number
}

export interface UpdateActividadPayload {
  tipo?: ActivityType
  fecha?: string
  descripcion?: string
  datos?: Record<string, unknown>
}

export interface AlertaDto {
  id: number
  tipo: AlertType
  valorDetectado: number
  fecha: string
  cultivoId: number
  leida: boolean
}

export interface CreateAlertaPayload {
  tipo: AlertType
  valorDetectado: number
  fecha: string
  cultivoId: number
}

export interface ReporteActividadesDto {
  cultivoId: number
  totalActividades: number
  porTipo: Record<string, number>
  desde: string | null
  hasta: string | null
}

type ApiBlob = Blob

export class ApiClientError extends Error {
  public readonly status: number
  public readonly details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

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

function handleUnauthorized(): void {
  useAuthStore.getState().clear()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

async function parseAsJson<T>(response: Response): Promise<ApiEnvelope<T>> {
  return (await response.json()) as ApiEnvelope<T>
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = createHeaders(init.headers)
  const shouldSerializeBody = init.body !== undefined && !(init.body instanceof FormData)

  if (shouldSerializeBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${withLeadingSlash(path)}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    handleUnauthorized()
  }

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (isJson) {
    const payload = await parseAsJson<T>(response)
    if (!response.ok || !payload.success) {
      throw new ApiClientError(payload.message || 'Error en la solicitud', response.status, payload.details)
    }

    return payload.data as T
  }

  if (!response.ok) {
    const text = await response.text()
    throw new ApiClientError(text || 'Error en la solicitud', response.status)
  }

  return (await response.blob()) as T
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  getBlob: (path: string) => request<ApiBlob>(path, { method: 'GET' }),

  probarConexion: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.get<{ success: boolean; message: string }>('/')
    return response
  },

  auth: {
    register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/api/auth/register', payload),
    login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/api/auth/login', payload),
    me: () => apiClient.get<AuthUser>('/api/auth/me'),
    forgotPassword: (payload: ForgotPasswordPayload) =>
      apiClient.post<ForgotPasswordResponse>('/api/auth/forgot-password', payload),
    resetPassword: (payload: ResetPasswordPayload) => apiClient.post<void>('/api/auth/reset-password', payload),
    updateProfile: (payload: UpdateProfilePayload) => apiClient.put<AuthUser>('/api/auth/me', payload),
    updatePassword: (payload: UpdatePasswordPayload) => apiClient.put<void>('/api/auth/me/password', payload),
  },

  parcelas: {
    list: () => apiClient.get<ParcelaDto[]>('/api/parcelas'),
    findOne: (id: number) => apiClient.get<ParcelaDto>(`/api/parcelas/${id}`),
    create: (payload: CreateParcelaPayload) => apiClient.post<ParcelaDto>('/api/parcelas', payload),
    update: (id: number, payload: UpdateParcelaPayload) => apiClient.put<ParcelaDto>(`/api/parcelas/${id}`, payload),
    delete: (id: number) => apiClient.delete<void>(`/api/parcelas/${id}`),
  },

  fincas: {
    list: () => apiClient.get<FincaDto[]>('/api/fincas'),
    findOne: (id: number) => apiClient.get<FincaDto>(`/api/fincas/${id}`),
    create: (payload: CreateFincaPayload) => apiClient.post<FincaDto>('/api/fincas', payload),
    update: (id: number, payload: UpdateFincaPayload) => apiClient.put<FincaDto>(`/api/fincas/${id}`, payload),
    delete: (id: number) => apiClient.delete<void>(`/api/fincas/${id}`),
  },

  operarios: {
    list: () => apiClient.get<OperarioConParcelasDto[]>('/api/operarios'),
    register: (payload: RegisterOperarioPayload) => apiClient.post<AuthUser>('/api/operarios', payload),
    assign: (payload: AsignarOperarioPayload) =>
      apiClient.post<AsignacionOperarioDto>('/api/operarios/asignaciones', payload),
    unassign: (operarioId: number, parcelaId: number) =>
      apiClient.delete<void>(`/api/operarios/asignaciones/${operarioId}/${parcelaId}`),
  },

  cultivos: {
    list: (tipoCultivo?: string) =>
      apiClient.get<CultivoDto[]>(`/api/cultivos${toQueryString({ tipoCultivo })}`),
    findOne: (id: number) => apiClient.get<CultivoDto>(`/api/cultivos/${id}`),
    create: (payload: CreateCultivoPayload) => apiClient.post<CultivoDto>('/api/cultivos', payload),
    update: (id: number, payload: UpdateCultivoPayload) => apiClient.put<CultivoDto>(`/api/cultivos/${id}`, payload),
    delete: (id: number) => apiClient.delete<void>(`/api/cultivos/${id}`),
  },

  actividades: {
    list: () => apiClient.get<ActividadDto[]>('/api/actividades'),
    findOne: (id: number) => apiClient.get<ActividadDto>(`/api/actividades/${id}`),
    listByCultivo: (cultivoId: number) => apiClient.get<ActividadDto[]>(`/api/actividades/cultivo/${cultivoId}`),
    create: (payload: CreateActividadPayload) => apiClient.post<ActividadDto>('/api/actividades', payload),
    update: (id: number, payload: UpdateActividadPayload) =>
      apiClient.put<ActividadDto>(`/api/actividades/${id}`, payload),
    delete: (id: number) => apiClient.delete<void>(`/api/actividades/${id}`),
  },

  alertas: {
    list: () => apiClient.get<AlertaDto[]>('/api/alertas'),
    findOne: (id: number) => apiClient.get<AlertaDto>(`/api/alertas/${id}`),
    listByCultivo: (cultivoId: number) => apiClient.get<AlertaDto[]>(`/api/alertas/cultivo/${cultivoId}`),
    create: (payload: CreateAlertaPayload) => apiClient.post<AlertaDto>('/api/alertas', payload),
    delete: (id: number) => apiClient.delete<void>(`/api/alertas/${id}`),
  },

  reportes: {
    actividades: (cultivoId: number) => apiClient.get<ReporteActividadesDto>(`/api/reportes/actividades/${cultivoId}`),
    actividadesCsv: (cultivoId: number) => apiClient.getBlob(`/api/reportes/actividades/${cultivoId}/csv`),
    riegos: (cultivoId: number) => apiClient.get<ReporteActividadesDto>(`/api/reportes/riegos/${cultivoId}`),
    fertilizaciones: (cultivoId: number) =>
      apiClient.get<ReporteActividadesDto>(`/api/reportes/fertilizaciones/${cultivoId}`),
  },
}
