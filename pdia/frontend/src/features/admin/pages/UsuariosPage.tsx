import { useCallback, useEffect, useState } from 'react'

import { Badge, Button, Card, Input } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserDto,
} from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../store/authStore'

interface UserFormState {
  nombre: string
  identificacion: string
  email: string
  password: string
  rol: 'PRODUCTOR' | 'OPERARIO' | 'TECNICO' | 'ADMINISTRADOR'
}

const initialUserForm: UserFormState = {
  nombre: '',
  identificacion: '',
  email: '',
  password: '',
  rol: 'PRODUCTOR',
}

const roleLabels: Record<string, string> = {
  PRODUCTOR: 'Productor',
  OPERARIO: 'Operario',
  TECNICO: 'Técnico',
  ADMINISTRADOR: 'Administrador',
}

const rolBadgeVariant = (rol: string) => {
  if (rol === 'ADMINISTRADOR') return 'primary' as const
  if (rol === 'TECNICO') return 'warning' as const
  if (rol === 'OPERARIO') return 'neutral' as const
  return 'safe' as const
}

export default function UsuariosPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<UserDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormState>(initialUserForm)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [filterRol, setFilterRol] = useState<string>('')
  // Form colapsable — solo se abre al pulsar "+" o al editar
  const [formOpen, setFormOpen] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = filterRol
        ? await apiClient.users.listByRol(filterRol)
        : await apiClient.users.list()
      setUsers(data)
    } catch (unknownError) {
      setError(unknownError instanceof ApiClientError ? unknownError.message : 'No fue posible cargar los usuarios.')
    } finally {
      setIsLoading(false)
    }
  }, [filterRol])

  useEffect(() => { void loadUsers() }, [loadUsers])

  const resetForm = () => {
    setForm(initialUserForm)
    setEditingUserId(null)
    setFormOpen(false)
    setError(null)
  }

  const handleCreate = async () => {
    if (!form.nombre || !form.identificacion || !form.email || !form.password) {
      setError('Todos los campos son requeridos.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const payload: CreateUserPayload = {
        nombre: form.nombre,
        identificacion: form.identificacion,
        email: form.email,
        password: form.password,
        rol: form.rol,
      }
      await apiClient.users.create(payload)
      setSuccess('Usuario creado correctamente.')
      resetForm()
      void loadUsers()
    } catch (unknownError) {
      setError(unknownError instanceof ApiClientError ? unknownError.message : 'No fue posible crear el usuario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingUserId || !form.nombre || !form.identificacion || !form.email) {
      setError('Todos los campos son requeridos.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const payload: UpdateUserPayload = {
        nombre: form.nombre,
        identificacion: form.identificacion,
        email: form.email,
        rol: form.rol,
      }
      await apiClient.users.update(editingUserId, payload)
      setSuccess('Usuario actualizado correctamente.')
      resetForm()
      void loadUsers()
    } catch (unknownError) {
      setError(unknownError instanceof ApiClientError ? unknownError.message : 'No fue posible actualizar el usuario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return
    setError(null)
    setSuccess(null)
    try {
      await apiClient.users.delete(userId)
      setSuccess('Usuario eliminado correctamente.')
      void loadUsers()
    } catch (unknownError) {
      setError(unknownError instanceof ApiClientError ? unknownError.message : 'No fue posible eliminar el usuario.')
    }
  }

  const startEdit = (user: UserDto) => {
    setForm({
      nombre: user.nombre,
      identificacion: user.identificacion,
      email: user.email,
      password: '',
      rol: user.rol as UserFormState['rol'],
    })
    setEditingUserId(user.id)
    setFormOpen(true)
    setError(null)
    setSuccess(null)
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Gestión de Usuarios</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Administra todos los usuarios del sistema.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-xl bg-tertiary-container px-3 py-2 text-sm font-semibold text-on-tertiary-container">{success}</p>
      ) : null}

      {/* ── Tabla de usuarios ── */}
      <Card>
        {/* Header de la card con filtro y botón "+" */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-title-md font-semibold text-on-surface">Usuarios del sistema</h2>
            <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
              {users.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="PRODUCTOR">Productor</option>
              <option value="OPERARIO">Operario</option>
              <option value="TECNICO">Técnico</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
            <Button
              size="small"
              variant="primary"
              leadingIcon="person_add"
              onClick={() => {
                setEditingUserId(null)
                setForm(initialUserForm)
                setFormOpen(true)
              }}
            >
              Nuevo usuario
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-on-surface-variant">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-on-surface-variant">No hay usuarios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-high text-on-surface">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="hidden px-4 py-3 md:table-cell">Identificación</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low">
                    <td className="px-4 py-3 font-medium text-on-surface">{user.nombre}</td>
                    <td className="hidden px-4 py-3 text-on-surface-variant md:table-cell">{user.identificacion}</td>
                    <td className="hidden px-4 py-3 text-on-surface-variant sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rolBadgeVariant(user.rol)}>
                        {roleLabels[user.rol] || user.rol}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => startEdit(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => void handleDelete(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Modal / drawer de crear / editar ── */}
      {formOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgb(0_0_0_/_30%)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">
                {editingUserId ? 'Editar usuario' : 'Nuevo usuario'}
              </h2>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-container-high"
                onClick={resetForm}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="user-nombre"
                label="Nombre completo"
                onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))}
                placeholder="Juan Pérez"
                type="text"
                value={form.nombre}
              />
              <Input
                id="user-identificacion"
                label="Identificación"
                onChange={(e) => setForm((c) => ({ ...c, identificacion: e.target.value }))}
                placeholder="123456789"
                type="text"
                value={form.identificacion}
              />
              <Input
                id="user-email"
                label="Correo"
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                type="email"
                value={form.email}
              />
              {!editingUserId && (
                <Input
                  id="user-password"
                  label="Contraseña"
                  onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                  placeholder="******"
                  type="password"
                  value={form.password}
                />
              )}
              <label className="space-y-2 md:col-span-2" htmlFor="user-rol">
                <span className="text-label-md block text-on-surface-variant">Rol</span>
                <select
                  id="user-rol"
                  className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                  onChange={(e) => setForm((c) => ({ ...c, rol: e.target.value as UserFormState['rol'] }))}
                  value={form.rol}
                >
                  <option value="PRODUCTOR">Productor</option>
                  <option value="OPERARIO">Operario</option>
                  <option value="TECNICO">Técnico</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </label>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button disabled={isSubmitting} onClick={resetForm} variant="tertiary">
                Cancelar
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => void (editingUserId ? handleUpdate() : handleCreate())}
                variant="primary"
              >
                {isSubmitting ? 'Guardando...' : editingUserId ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
