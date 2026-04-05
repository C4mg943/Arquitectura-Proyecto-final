import { create } from 'zustand'

export type UserRole = 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR'

export interface AuthUser {
  id: number
  nombre: string
  identificacion: string
  email: string
  rol: UserRole
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isHydrated: boolean
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setToken: (token: string | null) => void
  setUser: (user: AuthUser | null) => void
  clear: () => void
}

export const AUTH_TOKEN_KEY = 'auth-token'
export const AUTH_USER_KEY = 'auth-user'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readToken(): string | null {
  if (!canUseStorage()) {
    return null
  }
  const value = window.localStorage.getItem(AUTH_TOKEN_KEY)
  return value && value.length > 0 ? value : null
}

function readUser(): AuthUser | null {
  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(AUTH_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed || typeof parsed.id !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function persistAuth(token: string | null, user: AuthUser | null): void {
  if (!canUseStorage()) {
    return
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(AUTH_USER_KEY)
  }
}

const initialToken = readToken()
const initialUser = readUser()

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  user: initialUser,
  isHydrated: true,
  isAuthenticated: Boolean(initialToken),
  setAuth: (token, user) => {
    persistAuth(token, user)
    set({ token, user, isAuthenticated: true })
  },
  setToken: (token) => {
    const user = get().user
    persistAuth(token, user)
    set({ token, isAuthenticated: Boolean(token) })
  },
  setUser: (user) => {
    const token = get().token
    persistAuth(token, user)
    set({ user })
  },
  clear: () => {
    persistAuth(null, null)
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
