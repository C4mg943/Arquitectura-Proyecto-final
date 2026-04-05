import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button, Card, Input } from '../shared/components/common'
import { apiClient, ApiClientError } from '../shared/services/apiClient'
import { forgotPasswordSchema } from '../shared/utils/validators'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setResetUrl(null)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Correo inválido')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient.auth.forgotPassword(parsed.data)
      setSuccess('Si el correo existe, te enviamos un enlace de recuperación.')
      if (response.resetUrl) {
        setResetUrl(response.resetUrl)
      }
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible iniciar la recuperación de contraseña.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-headline-md text-primary">Recuperar contraseña</h1>
          <p className="mt-2 text-on-surface-variant">Ingresa tu correo para restablecer tu acceso</p>
        </div>

        <Card className="space-y-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              id="email-forgot"
              icon="mail"
              label="Correo electrónico"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              type="email"
              value={email}
            />

            {error ? (
              <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
            ) : null}

            {success ? (
              <p className="rounded-xl bg-primary-fixed px-3 py-2 text-sm font-semibold text-on-primary-fixed">{success}</p>
            ) : null}

            {resetUrl ? (
              <p className="rounded-xl bg-secondary-container px-3 py-2 text-sm font-semibold text-on-secondary-container">
                Enlace de desarrollo:{' '}
                <a className="underline" href={resetUrl}>
                  Abrir recuperación
                </a>
              </p>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </Button>

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
