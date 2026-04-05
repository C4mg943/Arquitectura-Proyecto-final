import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button, Card, Input } from '../shared/components/common'
import { apiClient, ApiClientError } from '../shared/services/apiClient'
import { resetPasswordSchema } from '../shared/utils/validators'

function useResetToken(): string {
  const location = useLocation()

  return useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('token') ?? ''
  }, [location.search])
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const token = useResetToken()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.auth.resetPassword({ token: parsed.data.token, password: parsed.data.password })
      setSuccess('Contraseña actualizada correctamente. Redirigiendo al login...')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible restablecer la contraseña.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-headline-md text-primary">Restablecer contraseña</h1>
          <p className="mt-2 text-on-surface-variant">Ingresa tu nueva contraseña para continuar</p>
        </div>

        <Card className="space-y-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              id="password-reset"
              icon="lock"
              label="Nueva contraseña"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />

            <Input
              id="confirm-password-reset"
              icon="lock"
              label="Confirmar contraseña"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
            />

            {error ? (
              <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
            ) : null}

            {success ? (
              <p className="rounded-xl bg-primary-fixed px-3 py-2 text-sm font-semibold text-on-primary-fixed">{success}</p>
            ) : null}

            <Button className="w-full" disabled={isSubmitting || token.length === 0} type="submit" variant="primary">
              {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>

            {token.length === 0 ? (
              <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">
                Token de recuperación no encontrado.
              </p>
            ) : null}

            <p className="text-center text-sm text-on-surface-variant">
              Volver a{' '}
              <Link className="font-bold text-primary hover:underline" to="/login">
                iniciar sesión
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </section>
  )
}
