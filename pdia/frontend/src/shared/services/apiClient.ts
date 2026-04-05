const BASE_URL = import.meta.env.VITE_API_URL;

interface ApiEnvelope<T> {
    success: boolean;
    message: string;
    data?: T;
    details?: unknown;
}

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    nombre: string;
    identificacion: string;
    email: string;
    password: string;
    rol?: 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR';
}

interface AuthUser {
    id: number;
    nombre: string;
    identificacion: string;
    email: string;
    rol: 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR';
}

interface AuthData {
    token: string;
    user: AuthUser;
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiEnvelope<T>> {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {})
        }
    });

    const body = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok) {
        throw new Error(body.message || 'Error en la solicitud');
    }
    return body;
}

export const apiClient = {
    async probarConexion() {
        return request<{ mensaje: string }>('/');
    },
    async login(payload: LoginPayload) {
        return request<AuthData>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    async register(payload: RegisterPayload) {
        return request<AuthData>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    async getProfile(token: string) {
        return request<AuthUser>('/api/auth/me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }
};
