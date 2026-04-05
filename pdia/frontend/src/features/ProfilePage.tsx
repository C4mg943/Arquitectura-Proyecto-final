import { useEffect, useState, type FormEvent } from 'react'

import { Button, Card, Input } from '../shared/components/common'
import { apiClient, ApiClientError } from '../shared/services/apiClient'
import { updatePasswordSchema, updateProfileSchema } from '../shared/utils/validators'
import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [nombre, setNombre] = useState('')
  const [identificacion, setIdentificacion] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setNombre(user.nombre)
      setIdentificacion(user.identificacion)
      setEmail(user.email)
    }
  }, [user])

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    const parsed = updateProfileSchema.safeParse({ nombre, identificacion, email })
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? 'Datos de perfil inválidos')
      return
    }

    setIsSavingProfile(true)
    try {
      const updated = await apiClient.auth.updateProfile(parsed.data)
      setUser(updated)
      setProfileSuccess('Perfil actualizado correctamente.')
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setProfileError(unknownError.message)
      } else {
        setProfileError('No fue posible actualizar el perfil.')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    const parsed = updatePasswordSchema.safeParse({ currentPassword, newPassword, confirmNewPassword })
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? 'Datos de contraseña inválidos')
      return
    }

    setIsSavingPassword(true)
    try {
      await apiClient.auth.updatePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordSuccess('Contraseña actualizada correctamente.')
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setPasswordError(unknownError.message)
      } else {
        setPasswordError('No fue posible actualizar la contraseña.')
      }
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Mi Perfil</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">Administra tu información personal y contraseña de acceso.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card subtitle="Actualiza nombre, identificación y correo" title="Datos personales">
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <Input
              id="profile-name"
              icon="person"
              label="Nombre completo"
              onChange={(event) => setNombre(event.target.value)}
              type="text"
              value={nombre}
            />
            <Input
              id="profile-identificacion"
              icon="badge"
              label="Identificación"
              onChange={(event) => setIdentificacion(event.target.value)}
              type="text"
              value={identificacion}
            />
            <Input
              id="profile-email"
              icon="mail"
              label="Correo"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />

            {profileError ? (
              <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{profileError}</p>
            ) : null}

            {profileSuccess ? (
              <p className="rounded-xl bg-primary-fixed px-3 py-2 text-sm font-semibold text-on-primary-fixed">{profileSuccess}</p>
            ) : null}

            <Button className="w-full" disabled={isSavingProfile} type="submit" variant="primary">
              {isSavingProfile ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </Card>

        <Card subtitle="Cambia tu contraseña actual" title="Seguridad">
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <Input
              id="current-password"
              icon="lock"
              label="Contraseña actual"
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              value={currentPassword}
            />
            <Input
              id="new-password"
              icon="lock"
              label="Nueva contraseña"
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
            <Input
              id="confirm-new-password"
              icon="lock"
              label="Confirmar nueva contraseña"
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              type="password"
              value={confirmNewPassword}
            />

            {passwordError ? (
              <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{passwordError}</p>
            ) : null}

            {passwordSuccess ? (
              <p className="rounded-xl bg-primary-fixed px-3 py-2 text-sm font-semibold text-on-primary-fixed">{passwordSuccess}</p>
            ) : null}

            <Button className="w-full" disabled={isSavingPassword} type="submit" variant="secondary">
              {isSavingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}
