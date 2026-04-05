import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button, Card, Input } from '../../../shared/components/common'
import { apiClient, ApiClientError } from '../../../shared/services/apiClient'
import { registerSchema } from '../../../shared/utils/validators'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [identificacion, setIdentificacion] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const parsed = registerSchema.safeParse({ nombre, identificacion, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.auth.register(parsed.data)
      setSuccess('Cuenta creada correctamente. Ahora puedes iniciar sesión.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 900)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible registrar la cuenta en este momento.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-headline-md text-primary">Crear cuenta</h1>
          <p className="mt-2 text-on-surface-variant">Regístrate como productor agrícola</p>
        </div>

        <Card className="space-y-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              id="name"
              icon="person"
              label="Nombre completo"
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej: Juan Pérez"
              type="text"
              value={nombre}
            />
            <Input
              id="identificacion-register"
              icon="badge"
              label="Identificación"
              onChange={(event) => setIdentificacion(event.target.value)}
              placeholder="Ej: 123456789"
              type="text"
              value={identificacion}
            />
            <Input
              id="email-register"
              icon="mail"
              label="Correo"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              type="email"
              value={email}
            />
            <Input
              id="password-register"
              icon="lock"
              label="Contraseña"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />

            {error ? (
              <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl bg-primary-fixed px-3 py-2 text-sm font-semibold text-on-primary-fixed">
                {success}
              </p>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <p className="text-center text-sm text-on-surface-variant">
              ¿Ya tienes cuenta?
              <Link className="ml-1 font-bold text-primary hover:underline" to="/login">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </section>
  )
}
