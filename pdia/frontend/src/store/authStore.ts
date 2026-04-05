import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: {
    id: number
    nombre: string
    identificacion: string
    email: string
    rol: 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR'
  } | null
  setSession: (token: string, user: AuthState['user']) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setSession: (token, user) => set({ token, user }),
  clear: () => set({ token: null, user: null }),
}))
