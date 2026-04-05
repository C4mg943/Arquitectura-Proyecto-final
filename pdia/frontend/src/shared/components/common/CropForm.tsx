import { type FormEvent, useMemo, useState } from 'react'

import type { CreateCultivoPayload, CultivoDto, ParcelaDto } from '../../services/apiClient'
import { cultivoSchema } from '../../utils/validators'
import Button from './Button'
import Input from './Input'

type CropFormMode = 'create' | 'edit'

interface CropFormProps {
  mode: CropFormMode
  parcelas: ParcelaDto[]
  initialValue?: CultivoDto | null
  isSubmitting: boolean
  onSubmit: (payload: CreateCultivoPayload) => Promise<void>
  onCancel: () => void
}

interface CropFormState {
  tipoCultivo: string
  fechaSiembra: string
  estado: CreateCultivoPayload['estado']
  observaciones: string
  parcelaId: string
}

const initialState: CropFormState = {
  tipoCultivo: '',
  fechaSiembra: '',
  estado: 'EN_CRECIMIENTO',
  observaciones: '',
  parcelaId: '',
}

export default function CropForm({ mode, parcelas, initialValue, isSubmitting, onSubmit, onCancel }: CropFormProps) {
  const seedForm = useMemo<CropFormState>(() => {
    if (mode === 'edit' && initialValue) {
      return {
        tipoCultivo: initialValue.tipoCultivo,
        fechaSiembra: initialValue.fechaSiembra,
        estado: initialValue.estado,
        observaciones: initialValue.observaciones ?? '',
        parcelaId: String(initialValue.parcelaId),
      }
    }

    if (mode === 'create' && parcelas.length > 0) {
      return { ...initialState, parcelaId: String(parcelas[0].id) }
    }

    return initialState
  }, [initialValue, mode, parcelas])

  const [form, setForm] = useState<CropFormState>(seedForm)
  const [error, setError] = useState<string | null>(null)

  const parcelOptions = useMemo(() => parcelas.map((parcela) => ({ id: parcela.id, nombre: parcela.nombre })), [parcelas])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const payload = {
      tipoCultivo: form.tipoCultivo.trim(),
      fechaSiembra: form.fechaSiembra,
      estado: form.estado,
      observaciones: form.observaciones.trim() || undefined,
      parcelaId: Number(form.parcelaId),
    }

    const parsed = cultivoSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos de cultivo')
      return
    }

    await onSubmit(parsed.data)
  }

  const title = mode === 'create' ? 'Nuevo cultivo' : 'Editar cultivo'
  const submitLabel = mode === 'create' ? 'Crear cultivo' : 'Guardar cambios'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgb(0_0_0_/_30%)]">
        <h2 className="mb-4 text-xl font-bold text-on-surface">{title}</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="crop-tipo"
              label="Tipo de cultivo"
              onChange={(event) => setForm((current) => ({ ...current, tipoCultivo: event.target.value }))}
              placeholder="Tomate"
              type="text"
              value={form.tipoCultivo}
            />

            <label className="space-y-2" htmlFor="crop-parcela">
              <span className="text-label-md block text-on-surface-variant">Parcela</span>
              <select
                id="crop-parcela"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) => setForm((current) => ({ ...current, parcelaId: event.target.value }))}
                value={form.parcelaId}
              >
                <option value="">Selecciona una parcela</option>
                {parcelOptions.map((parcela) => (
                  <option key={parcela.id} value={parcela.id}>
                    {parcela.nombre}
                  </option>
                ))}
              </select>
            </label>

            <Input
              id="crop-fecha"
              label="Fecha de siembra"
              onChange={(event) => setForm((current) => ({ ...current, fechaSiembra: event.target.value }))}
              type="date"
              value={form.fechaSiembra}
            />

            <label className="space-y-2" htmlFor="crop-estado">
              <span className="text-label-md block text-on-surface-variant">Estado</span>
              <select
                id="crop-estado"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estado: event.target.value as CreateCultivoPayload['estado'],
                  }))
                }
                value={form.estado}
              >
                <option value="EN_CRECIMIENTO">En crecimiento</option>
                <option value="COSECHADO">Cosechado</option>
                <option value="AFECTADO">Afectado</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <label className="space-y-2" htmlFor="crop-observaciones">
                <span className="text-label-md block text-on-surface-variant">Observaciones</span>
                <textarea
                  id="crop-observaciones"
                  className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                  onChange={(event) => setForm((current) => ({ ...current, observaciones: event.target.value }))}
                  placeholder="Observaciones del cultivo..."
                  rows={4}
                  value={form.observaciones}
                />
              </label>
            </div>
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
