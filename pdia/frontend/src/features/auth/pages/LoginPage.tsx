import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../shared/services/apiClient'
import { loginSchema } from '../../../shared/utils/validators'
import { useAuthStore } from '../../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSession } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      return
    }

    try {
      setIsLoading(true)
      const response = await apiClient.login(parsed.data)
      if (!response.data) {
        setErrorMessage('La respuesta del servidor no contiene sesión')
        return
      }
      setSession(response.data.token, response.data.user)
      navigate('/')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-slate-600">Accede con tu correo y contraseña.</p>

      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="correo">
            Correo
          </label>
          <input
            id="correo"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {isLoading ? 'Validando...' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
