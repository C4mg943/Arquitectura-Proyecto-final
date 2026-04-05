import { Link } from 'react-router-dom'

import { Button, Card, Input } from '../../../shared/components/common'

export default function LoginPage() {
  return (
    <section className="relative flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <div className="grain-overlay absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              agriculture
            </span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary">AgroPrecision</h1>
          <p className="mt-2 text-on-surface-variant">Accede a tu panel de agronomía</p>
        </div>

        <Card className="space-y-6">
          <form className="space-y-5">
            <Input id="email" icon="mail" label="Correo electrónico" placeholder="nombre@empresa.com" type="email" />
            <Input id="password" icon="lock" label="Contraseña" placeholder="••••••••" type="password" />

            <div className="flex justify-end">
              <Link className="text-sm font-semibold text-primary hover:text-primary-container" to="/register">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button className="w-full" trailingIcon="arrow_forward" type="submit" variant="primary">
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-on-surface-variant">
            ¿No tienes una cuenta?
            <Link className="ml-1 font-bold text-primary hover:underline" to="/register">
              Registrarse
            </Link>
          </p>
        </Card>
      </div>
    </section>
  )
}
