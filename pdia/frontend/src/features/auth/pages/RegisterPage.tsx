import { Link } from 'react-router-dom'

import { Button, Card, Input } from '../../../shared/components/common'

export default function RegisterPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-headline-md text-primary">Crear cuenta</h1>
          <p className="mt-2 text-on-surface-variant">Regístrate como productor agrícola</p>
        </div>

        <Card className="space-y-5">
          <Input id="name" icon="person" label="Nombre completo" placeholder="Ej: Juan Pérez" type="text" />
          <Input id="email-register" icon="mail" label="Correo" placeholder="correo@ejemplo.com" type="email" />
          <Input id="password-register" icon="lock" label="Contraseña" placeholder="••••••••" type="password" />

          <Button className="w-full" type="button" variant="primary">
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-on-surface-variant">
            ¿Ya tienes cuenta?
            <Link className="ml-1 font-bold text-primary hover:underline" to="/login">
              Iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
    </section>
  )
}
