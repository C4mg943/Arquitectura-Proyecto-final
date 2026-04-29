import { type FormEvent, useMemo, useState } from 'react'

import type { CreateParcelaPayload, FincaDto, ParcelaDto } from '../../services/apiClient'
import { parcelaSchema } from '../../utils/validators'
import Button from './Button'
import Input from './Input'

type ParcelFormMode = 'create' | 'edit'

interface ParcelFormProps {
  mode: ParcelFormMode
  fincas: FincaDto[]
  initialValue?: ParcelaDto | null
  isSubmitting: boolean
  onSubmit: (payload: CreateParcelaPayload) => Promise<void>
  onCancel: () => void
}

interface ParcelFormState {
  nombre: string
  municipio: string
  hectareas: string
  latitud: string
  longitud: string
  fincaId: string
}

const initialState: ParcelFormState = {
  nombre: '',
  municipio: '',
  hectareas: '',
  latitud: '',
  longitud: '',
  fincaId: '',
}

export default function ParcelForm({ mode, fincas, initialValue, isSubmitting, onSubmit, onCancel }: ParcelFormProps) {
  const seedForm = useMemo<ParcelFormState>(() => {
    if (mode === 'edit' && initialValue) {
      return {
        nombre: initialValue.nombre ?? '',
        municipio: initialValue.municipio ?? '',
        hectareas: initialValue.hectareas != null ? String(initialValue.hectareas) : '',
        latitud: initialValue.latitud != null ? String(initialValue.latitud) : '',
        longitud: initialValue.longitud != null ? String(initialValue.longitud) : '',
        fincaId: initialValue.fincaId != null ? String(initialValue.fincaId) : '',
      }
    }

    if (mode === 'create' && fincas.length > 0) {
      return {
        ...initialState,
        fincaId: String(fincas[0].id),
      }
    }

    return initialState
  }, [fincas, mode, initialValue])

  const [form, setForm] = useState<ParcelFormState>(seedForm)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const payload = {
      nombre: form.nombre.trim(),
      municipio: form.municipio.trim(),
      hectareas: Number(form.hectareas),
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
      fincaId: Number(form.fincaId),
    }

    const parsed = parcelaSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos de parcela')
      return
    }

    await onSubmit(parsed.data)
  }

  const title = mode === 'create' ? 'Nueva parcela' : 'Editar parcela'
  const submitLabel = mode === 'create' ? 'Crear parcela' : 'Guardar cambios'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgb(0_0_0_/_30%)]">
        <h2 className="mb-4 text-xl font-bold text-on-surface">{title}</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="parcel-nombre"
              label="Nombre"
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              placeholder="Finca El Roble"
              type="text"
              value={form.nombre}
            />

            <Input
              id="parcel-municipio"
              label="Municipio"
              onChange={(event) => setForm((current) => ({ ...current, municipio: event.target.value }))}
              placeholder="Santa Marta"
              type="text"
              value={form.municipio}
            />

            <Input
              id="parcel-hectareas"
              label="Hectáreas"
              min="0"
              onChange={(event) => setForm((current) => ({ ...current, hectareas: event.target.value }))}
              placeholder="12.5"
              step="0.01"
              type="number"
              value={form.hectareas}
            />

            <Input
              id="parcel-latitud"
              label="Latitud"
              onChange={(event) => setForm((current) => ({ ...current, latitud: event.target.value }))}
              placeholder="11.2408"
              step="0.000001"
              type="number"
              value={form.latitud}
            />

            <Input
              id="parcel-longitud"
              label="Longitud"
              onChange={(event) => setForm((current) => ({ ...current, longitud: event.target.value }))}
              placeholder="-74.1990"
              step="0.000001"
              type="number"
              value={form.longitud}
            />

            <label className="space-y-2 md:col-span-2" htmlFor="parcel-finca">
              <span className="text-label-md block text-on-surface-variant">Finca</span>
              <select
                id="parcel-finca"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) => setForm((current) => ({ ...current, fincaId: event.target.value }))}
                value={form.fincaId}
              >
                <option value="">Selecciona una finca</option>
                {fincas.map((finca) => (
                  <option key={finca.id} value={finca.id}>
                    {finca.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="tertiary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? 'Guardando...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
